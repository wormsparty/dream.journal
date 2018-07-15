from flask import Flask, render_template, request
import sqlite3
import json
import uuid
import datetime
import sys
import threading


try:
    import config
except ImportError:
    print('Please provide a config.py with the configuration values')
    quit()

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_subjects', methods=['POST'])
def get_subjects():
    conn = sqlite3.connect(config.dbfile)

    try:
        c = conn.cursor()

        c.execute('SELECT uid, subject, color FROM subjects')

        result = []
        for s in c.fetchall():
            result.append({'uid': s[0], 'subject': s[1], 'color': s[2]})

        return json.dumps(result)
    finally:
        conn.close()


@app.route('/get_entries', methods=['POST'])
def get_entries():
    suid = request.form['suid']

    conn = sqlite3.connect(config.dbfile)

    try:
        c = conn.cursor()

        c.execute('SELECT uid, day, month, year, title FROM entry WHERE suid = ?', suid)

        result = []
        for e in c.fetchall():
            result.append({'suid': suid, 'uid': e[0], 'day': e[1], 'month': e[2], 'year': e[3], 'title': e[4]})

        print(result)
        return json.dumps(result)
    finally:
        conn.close()


@app.route('/add_subject', methods=['POST'])
def add_subject():
    uid = str(uuid.uuid4())
    subject = request.form['subject']
    color = request.form['color']

    print('create subject uid = {}, subject: {}, color: {}'.format(uid, subject, color))

    conn = sqlite3.connect(config.dbfile)

    try:
        c = conn.cursor()

        c.execute('INSERT INTO subjects(uid, subject, color) values (?, ?, ?)', (uid, subject, color))
        conn.commit()
        return uid
    finally:
        conn.close()


@app.route('/add_entry', methods=['POST'])
def add_entry():
    suid = request.form['suid']
    uid = str(uuid.uuid4())
    title = request.form['title']
    now = datetime.datetime.utcnow()

    print('create entry uid = {}, suid = {}, title: {}, date: {}'.format(uid, suid, title, str(now)))

    conn = sqlite3.connect(config.dbfile)

    try:
        c = conn.cursor()

        day = now.day
        month = now.month
        year = now.year

        c.execute('''
          INSERT INTO entry(suid, uid, title, day, month, year) 
          values (?, ?, ?, ?, ?, ?)
        ''', (suid, uid, title, day, month, year))

        conn.commit()
        return json.dumps({ 'suid': suid, 'uid': uid, 'title': title, 'day': day, 'month': month, 'year': year})
    finally:
        conn.close()


@app.route('/edit_subject', methods=['POST'])
def edit_subject():
    uid = request.form['uid']
    subject = request.form['subject']
    color = request.form['color']

    print('edit subject uid = {}, sujet: {}, couleur: []'.format(uid, subject, color))

    conn = sqlite3.connect(config.dbfile)

    try:
        c = conn.cursor()
        c.execute('UPDATE subjects SET subject = ?, color = ? WHERE uid = ?', [(subject, color, uid)])

        if c.fetchone() == 1:
            conn.commit()
            return uid
        else:
            return 'NOT_EXIST'
    finally:
        conn.close()


@app.route('/edit_entry', methods=['POST'])
def edit_entry():
    suid = request.form['suid']
    uid = request.form['uid']
    title = request.form['title']

    print('edit entry suid = {}, uid = {}, title: {}'.format(suid, uid, title))

    conn = sqlite3.connect(config.dbfile)

    try:
        c = conn.cursor()
        c.execute('UPDATE entry SET suid = ?, title = ? WHERE uid = ?', (suid, title, uid))
        conn.commit()
        return uid
    finally:
        conn.close()


@app.route('/delete_subject', methods=['POST'])
def delete_subject():
    uid = request.form['uid']

    print('Sujet à supprimer: ' + uid)

    conn = sqlite3.connect(config.dbfile)

    try:
        c = conn.cursor()

        c.execute('SELECT COUNT(*) FROM entry WHERE suid = ?', uid)

        if c.fetchone() != 0:
            return 'ASSIGNED'

        c.execute('DELETE FROM subjects WHERE uid = ?', uid)

        if c.fetchone() == 1:
            conn.commit()
            return 'OK'
        else:
            return 'NOT_EXIST'
    finally:
        conn.close()


@app.route('/delete_entry', methods=['POST'])
def delete_entry():
    uid = request.form['uid']

    print('Entry to delete: ' + uid)

    conn = sqlite3.connect(config.dbfile)

    try:
        c = conn.cursor()

        c.execute('SELECT COUNT(*) FROM message WHERE euid = ?', uid)

        if c.fetchone() != 0:
            return 'ASSIGNED'

        c.execute('DELETE FROM entry WHERE uid = ?', uid)
        conn.commit()
        return 'OK'
    finally:
        conn.close()


def kill_process():
    shutdown = request.environ.get('werkzeug.server.shutdown')

    if shutdown is not None:
        print('Command-line kill')
        shutdown()
        sys.exit(0)
    else:
        # gunicorn version
        print('gunicorn kill')
        sys.exit(4)


@app.route('/do_deploy', methods=['POST'])
def do_deploy():
    print("J'APPELLE DO_DEPLOY")

    config.deployed = False

    t = threading.Timer(1.0, kill_process)
    t.run()

    return ''


@app.route('/is_deployed', methods=['POST'])
def is_deployed():
    return str(config.deployed)


if __name__ == '__main__':
    app.run()
