from flask import Flask, render_template, request
import sqlite3
import json
import uuid

app = Flask(__name__)
dbfile = 'database.sqlite'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_subjects', methods=['POST'])
def get_subjects():
    conn = sqlite3.connect(dbfile)

    try:
        c = conn.cursor()

        c.execute('SELECT * FROM subjects')

        result = []
        for s in c.fetchall():
            result.append({'uid': s[0], 'subject': s[1], 'color': s[2]})

        return json.dumps(result)
    finally:
        conn.close()


@app.route('/get_elements', methods=['POST'])
def get_elements(suid):
    conn = sqlite3.connect(dbfile)

    try:
        c = conn.cursor()

        c.execute('SELECT * FROM entry WHERE suid = ?', suid)

        result = []
        for e in c.fetchall():
            result.append({'suid': e[0], 'date': e[1], 'title': e[2], 'text': e[3]})

        return json.dumps(result)
    finally:
        conn.close()


@app.route('/add_subject', methods=['POST'])
def add_subject():
    uid = str(uuid.uuid4())
    subject = request.form['subject']
    color = request.form['color']

    print('create uid = ' + uid + ', sujet: ' + subject + ', couleur: ' + color)

    conn = sqlite3.connect(dbfile)

    try:
        c = conn.cursor()

        c.execute('INSERT INTO subjects(uid, subject, color) values (?, ?, ?)', (uid, subject, color))
        conn.commit()
        return uid
    finally:
        conn.close()


@app.route('/edit_subject', methods=['POST'])
def edit_subject():
    uid = request.form['uid']
    subject = request.form['subject']
    color = request.form['color']

    print('edit uid = ' + uid + ', sujet: ' + subject + ', couleur: ' + color)

    conn = sqlite3.connect(dbfile)

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


@app.route('/delete_subject', methods=['POST'])
def delete_subject():
    uid = request.form['uid']

    print('Sujet à supprimer: ' + uid)

    conn = sqlite3.connect(dbfile)

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


if __name__ == '__main__':
    app.run()
