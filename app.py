from flask import Flask, render_template
import shelve

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_subjects')
def get_subjects():
    d = shelve.open('database.db')

    try:
        return d['subjects']
    except KeyError:
        return []
    finally:
        d.close()


@app.route('/add_subject')
def add_subject(subject):
    d = shelve.open('database.db')

    try:
        subjects = d['subjects']
    except KeyError:
        subjects = []

    subjects.append(subject)
    d['subjects'] = subjects
    return 'OK'


if __name__ == '__main__':
    app.run()
