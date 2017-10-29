from flask import Flask, json, abort, request, render_template, url_for, Markup, Response
from flask_socketio import SocketIO, join_room, close_room, emit
from flask_sqlalchemy import SQLAlchemy
from uuid import uuid4
from datetime import datetime
from random import randrange
import settings
import functools

app = Flask(__name__)
app.config.update(settings.config)
socketio = SocketIO(app)
socketio.init_app(app)
db = SQLAlchemy(app)


class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.String(settings.room_id_len), unique=True)
    lockedout = db.Column(db.Boolean, default=False)
    lock_res_cnt = db.Column(db.Integer, default=0)
    lock_res_cnt_req = db.Column(db.Integer, default=0)
    lockout_id = db.Column(db.Integer, default=0)
    earliest_buzz = db.Column(db.BigInteger, default=None, nullable=True)
    eb_uuid = db.Column(db.String(32), default='')
    sid = db.Column(db.String(32))

    def __repr__(self):
        return '<Game {}>'.format(self.room_id)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(settings.name_len))
    team = db.Column(db.Integer)  # 0 for A; 1 for B
    game = db.relationship('Game', single_parent=True,
                           backref=db.backref('users', lazy='dynamic',
                                              cascade='all, delete-orphan'))
    game_room_id = db.Column(db.String(settings.room_id_len),
                             db.ForeignKey('game.room_id'))
    sid = db.Column(db.String(32))
    uuid = db.Column(db.String(32), unique=True)

    def __repr__(self):
        return '<User {} in {} on Team {}>'.format(self.name, self.game_room_id,
                                                   'A' if self.team == 0 else 'B')


def render_with_tv(*args, **kwargs):
    return render_template(*args, tv=settings.TV, **kwargs)


def new_uuid(game):
    uuidstr = uuid4().hex
    while game.users.filter_by(uuid=uuidstr).count() > 0:
        uuidstr = uuid4().hex
    return uuidstr


def new_room_id():
    def gen():
        res = str(randrange(0, 10 ** settings.room_id_len))
        return '0' * (settings.room_id_len - len(res)) + res
    room_id = gen()
    while Game.query.filter_by(room_id=room_id).count() > 0:
        room_id = gen()
    return room_id


@socketio.on('new_game')
def new_game(message):
    room_id = new_room_id()
    game = Game(room_id=room_id, sid=request.sid)
    db.session.add(game)
    db.session.commit()
    print('new_game:', room_id)
    return room_id


@socketio.on('join_game')
def join_game(message):
    room = message.get('room', None)
    name = message.get('name', None)
    team = message.get('team', None)
    if (room is None or name is None or len(name) > settings.name_len or
            team is None or (team != 0 and team != 1)):
        return 'malformed', '', False
    game = Game.query.filter_by(room_id=room).first()
    if game is None:
        return 'room_id', '', False
    user = User(name=name, game=game, sid=request.sid, uuid=new_uuid(game), team=team)
    db.session.add(user)
    db.session.commit()
    join_room(room)
    emit('new_user', {'uuid': user.uuid, 'name': Markup.escape(name), 'team': team}, room=game.sid)
    return 'success', user.uuid, game.lockedout


@socketio.on('buzz')
def buzz(message):
    time = message.get('time', None)
    if time is None:
        return 'malformed'
    user = User.query.filter_by(sid=request.sid).first()
    if user is None:
        return 'unknown_user'
    game = user.game
    if not game.lockedout:
        game.lockedout = True
        game.lock_res_cnt = 0
        game.lock_res_cnt_req = game.users.count()
        game.lockout_id += 1
        game.earliest_buzz = time
        game.eb_uuid = user.uuid
        db.session.add(game)
        db.session.commit()
        emit('lockout', {'lockout_id': game.lockout_id}, room=game.room_id)
        emit('lockout', {}, room=game.sid)
    elif time < game.earliest_buzz:
            game.earliest_buzz = time
            game.eb_uuid = user.uuid
            db.session.add(game)
            db.session.commit()
    return 'success'


@socketio.on('lock_res')
def lock_res(message):
    lockout_id = message.get('lockout_id', None)
    if lockout_id is None:
        return 'malformed'
    user = User.query.filter_by(sid=request.sid).first()
    if user is None:
        return 'unknown_user'
    game = user.game
    if game.lockedout and game.lockout_id == lockout_id:
        game.lock_res_cnt += 1
        db.session.add(game)
        db.session.commit()
        if game.lock_res_cnt >= game.lock_res_cnt_req:
            emit('winner', {'uuid': game.eb_uuid}, room=game.sid)
            emit('winner', {'uuid': game.eb_uuid}, room=game.room_id)


@socketio.on('disconnect')
def disconnect_handler():
    user = User.query.filter_by(sid=request.sid).first()
    if user is not None:
        emit('user_exit', {'uuid': user.uuid}, room=user.game.sid)
        db.session.delete(user)
        db.session.commit()
    else:
        game = Game.query.filter_by(sid=request.sid).first()
        if game is not None:
            emit('game_over', {}, room=game.room_id)
            close_room(game.room_id)
            db.session.delete(game)
            db.session.commit()


@socketio.on('reset_lockout')
def reset_lockout():
    game = Game.query.filter_by(sid=request.sid).first()
    if game is not None:
        game.lockedout = False
        db.session.add(game)
        db.session.commit()
        emit('reset_lockout', {}, room=game.room_id)
        return 'success'
    return 'failure'


@app.route('/h', methods=['GET'])
def scoreboard():
    return render_with_tv('scoreboard.html')


@app.route('/', methods=['GET'])
def buzzer():
    return render_with_tv('login.html', scoreboard_url=url_for('scoreboard'))


@app.route('/timesync', methods=['POST'])
def timesync():
    id = request.json.get('id', None)
    if id is None:
        abort(400)
    result = int(datetime.now().timestamp() * 1000)
    return json.jsonify(jsonrpc='2.0', id=id, result=result)


@app.route('/sitemap.txt', methods=['GET'])
def text_sitemap():
    resp = '\n'.join(map(functools.partial(url_for, _external=True),
                         ['buzzer', 'scoreboard']))
    return Response(resp, mimetype='text/plain')
