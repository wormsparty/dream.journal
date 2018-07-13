import shelve

d = shelve.open('database.db')

try:
    pass
finally:
    d.close()
