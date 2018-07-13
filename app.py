from flask import Flask, render_template, request
import shelve
import json
import uuid

app = Flask(__name__)


class Subject:
    def __init__(self, uid, subject, color):
        self.uid = uid
        self.subject = subject
        self.color = color

    def serialize(self):
        if isinstance(self, Subject):
            return {'uid': self.uid, 'subject': self.subject, 'color': self.color}
        else:
            raise ValueError('%r is not JSON serializable' % self)


class Element:
    def __init__(self, suid, date, title, text):
        self.suid = suid
        self.date = date
        self.title = title
        self.text = text

    def serialize(self):
        if isinstance(self, Element):
            return {'suid': self.suid, 'date': self.date, 'title': self.title, 'text': self.text}
        else:
            raise ValueError('%r is not JSON serializable' % self)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_subjects', methods=['POST'])
def get_subjects():
    d = shelve.open('database.db')

    try:
        subjects = d['subjects']
    except KeyError:
        subjects = []
    finally:
        d.close()

    return json.dumps(subjects, default=Subject.serialize)


@app.route('/get_elements', methods=['POST'])
def get_elements(suid):
    d = shelve.open('database.db')
    elements_for_subject = []

    try:
        elements = d['elements']
        elements_for_subject = []

        for e in elements:
            if e.suid == suid:
                elements_for_subject.append(e)
    except KeyError:
        pass
    finally:
        d.close()

    return json.dumps(elements_for_subject, default=Element.serialize)


@app.route('/add_subject', methods=['POST'])
def add_subject():
    uid = str(uuid.uuid4())
    subject = request.form['subject']
    color = request.form['color']

    print('create uid = ' + uid + ', sujet: ' + subject + ', couleur: ' + color)

    d = shelve.open('database.db')

    try:
        try:
            subjects = d['subjects']
        except KeyError:
            subjects = []

        subjects.append(Subject(uid, subject, color))
        d['subjects'] = subjects
    finally:
        d.close()

    return uid


@app.route('/edit_subject', methods=['POST'])
def edit_subject():
    uid = request.form['uid']
    subject = request.form['subject']
    color = request.form['color']

    print('edit uid = ' + uid + ', sujet: ' + subject + ', couleur: ' + color)

    d = shelve.open('database.db')

    try:
        try:
            subjects = d['subjects']
        except KeyError:
            subjects = []

        try:
            s = next(x for x in subjects if x.uid == uid)
            s.subject = subject
            s.color = color
        except StopIteration:
            return 'NOT_EXIST'

        d['subjects'] = subjects
    finally:
        d.close()

    return uid


@app.route('/delete_subject', methods=['POST'])
def delete_subject():
    uid = request.form['uid']

    print('Sujet à supprimer: ' + uid)
    d = shelve.open('database.db')

    try:
        try:
            subjects = d['subjects']
        except KeyError:
            subjects = []

        try:
            elements = d['elements']
        except KeyError:
            elements = []

        try:
            subject = next(x for x in subjects if x.uid == uid)
        except StopIteration:
            return 'NOT_EXIST'

        # Fail if subject has at least one element assigned!
        try:
            element = next(x for x in elements if x.suid == uid)
            return 'ASSIGNED'
        except StopIteration:
            pass

        subjects.remove(subject)
        d['subjects'] = subjects
    finally:
        d.close()

    return 'OK'


if __name__ == '__main__':
    app.run()
