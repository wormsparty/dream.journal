import sqlite3

conn = sqlite3.connect('database.sqlite')
c = conn.cursor()

c.execute('''
  CREATE TABLE IF NOT EXISTS subjects
  (uid text primary key, 
   subject text, 
   color text)
''')

conn.commit()

c.execute('''
  CREATE TABLE IF NOT EXISTS entry
  (suid text,
   uid text primary key,
   day text,
   year text,
   title text,
   FOREIGN KEY (suid) REFERENCES subject(uid))
''')

conn.commit()

c.execute('''
  CREATE TABLE IF NOT EXISTS message
  (euid text,
   uid text primary key,
   content text,
   FOREIGN KEY (euid) REFERENCES entry(uid))
''')

conn.commit()
