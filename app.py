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


class Template:
    def __init__(self, name, color, content):
        self.name = name
        self.color = color
        self.content = content

    def serialize(self):
        if isinstance(self, Template):
            return {'name': self.name, 'color': self.color, 'content': self.content}
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


@app.route('/get_templates', methods=['POST'])
def get_templates():
    d = shelve.open('database.db')

    try:
        templates = d['templates']
    except KeyError:
        templates = []
    finally:
        d.close()

    return json.dumps(templates, default=Template.serialize)


@app.route('/add_subject', methods=['POST'])
def add_subject():
    subject = request.form['subject']
    color = request.form['color']

    print('Nouveau sujet: ' + subject + ', avec couleur: ' + color)

    d = shelve.open('database.db')

    try:
        try:
            subjects = d['subjects']
        except KeyError:
            subjects = []

        if any(s.subject == subject for s in subjects):
            return 'ALREADY'

        subjects.append(Subject(subject, color))
        d['subjects'] = subjects
    finally:
        d.close()

    return 'OK'


@app.route('/add_template', methods=['POST'])
def add_template():
    name = request.form['name']
    color = request.form['color']
    content = request.form['content']

    print('Nouveau template: %s, couleur: %s' % (name, color))

    d = shelve.open('database.db')

    try:
        try:
            templates = d['templates']
        except KeyError:
            templates = []

        if any(s.name == name for s in templates):
            return 'ALREADY'

        templates.append(Template(name, color, content))
        d['templates'] = templates
    finally:
        d.close()

    return 'OK'


@app.route('/delete_subject', methods=['POST'])
def delete_subject():
    subject = request.form['subject']

    print('Sujet à supprimer: ' + subject)

    d = shelve.open('database.db')

    try:
        try:
            subjects = d['subjects']
        except KeyError:
            subjects = []

        try:
            element = next(x for x in subjects if x.subject == subject)
        except StopIteration:
            return 'NOT_EXIST'

        # TODO: REFUSER SI ASSIGNE À AU MOINS UN DOCUMENT

        subjects.remove(element)
        d['subjects'] = subjects
    finally:
        d.close()

    return 'OK'


@app.route('/delete_template', methods=['POST'])
def delete_template():
    name = request.form['name']

    print('Template à supprimer: %s' % name)

    d = shelve.open('database.db')

    try:
        try:
            templates = d['templates']
        except KeyError:
            templates = []

        try:
            element = next(x for x in templates if x.name == name)
        except StopIteration:
            return 'NOT_EXIST'

        templates.remove(element)
        d['templates'] = templates
    finally:
        d.close()

    return 'OK'


if __name__ == '__main__':
    app.run()
