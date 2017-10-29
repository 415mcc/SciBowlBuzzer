import os

config = {
    'SECRET_KEY': os.environ['SECRET_KEY'],
    'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL', 'sqlite:///test.db'),
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
}

room_id_len = 6
name_len = 15
