from flask import Flask, render_template, request
import shelve
import json

app = Flask(__name__)


class Subject:
    def __init__(self, subject, color):
        self.subject = subject
        self.color = color

    def serialize(self):
        if isinstance(self, Subject):
            return {'subject': self.subject, 'color': self.color}
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


@app.route('/add_subject', methods=['POST'])
def add_subject():
    subject = request.form['subject']
    color = request.form['color']

    print('Nouveau sujet: ' + subject + ', avec couleur: ' + color)

    d = shelve.open('database.db')

    # TODO: VERIFIER S'IL EXISTE DÉJÃ!!!!

    try:
        subjects = d['subjects']
    except KeyError:
        subjects = []

    subjects.append(Subject(subject, color))
    d['subjects'] = subjects
    return 'OK'


@app.route('/delete_subject', methods=['POST'])
def delete_subject():
    subject = request.form['subject']

    print('Sujet à supprimer: ' + subject)

    d = shelve.open('database.db')

    try:
        subjects = d['subjects']
    except KeyError:
        subjects = []

    # TODO: COMMENT ON SUPPRIME UN ELEMENT PRÉCIS SI ON LE TROUVE?

    to_delete = subjects.g
    subjects.remove(subject)
    d['subjects'] = subjects
    return 'OK'


if __name__ == '__main__':
    app.run()
