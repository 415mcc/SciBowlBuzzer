import os
import sys
import inspect

# --Begin Settings--

# Configuration Dictionary
#   * Key-value pairs will be copied into Flask object's config attribute
config = {
    'SECRET_KEY': os.environ['SECRET_KEY'],
    'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL', 'sqlite:///test.db'),
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
}


# Template Variables
#   * Attributes without a leading underscore will be copied to module level
class TV:
    room_id_len = 6
    name_len = 15
    github_link = 'https://github.com/lachm/SciBowlBuzzer'
    site_title = 'SciBowlBuzzer'
    locale = 'en_US'

# --End Settings--


# make template vars (attributes of TV) also attributes of the module
this_module = sys.modules[__name__]
for k, v in inspect.getmembers(TV):
    if k[0] != '_' and not hasattr(this_module, k):
        setattr(this_module, k, v)
