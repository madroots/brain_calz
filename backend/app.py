from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from datetime import datetime, timedelta
import random
import os

app = Flask(__name__)
app.secret_key = 'brain_calz_secret_key'  # In production, use a secure random key

# Get allowed origins from environment variable or use defaults
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3001,http://localhost:3000,http://127.0.0.1:3001,http://127.0.0.1:3000')
allowed_origins_list = [origin.strip() for origin in allowed_origins.split(',')]

# Configure CORS with allowed origins and credentials
CORS(app, supports_credentials=True, origins=allowed_origins_list, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'brain_calz.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    streak = db.Column(db.Integer, default=0)
    max_streak = db.Column(db.Integer, default=0)  # Track maximum streak achieved
    last_challenge_date = db.Column(db.Date)
    total_challenges_completed = db.Column(db.Integer, default=0)
    total_problems_solved = db.Column(db.Integer, default=0)
    total_correct_answers = db.Column(db.Integer, default=0)
    is_default = db.Column(db.Boolean, default=False)  # Flag for default user
    
    # Relationship with daily challenges
    daily_challenges = db.relationship('DailyChallenge', backref='user', lazy=True)
    progress = db.relationship('UserProgress', backref='user', lazy=True)

class DailyChallenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    score = db.Column(db.Integer)
    completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationship with problems
    problems = db.relationship('ChallengeProblem', backref='challenge', lazy=True)

class ChallengeProblem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('daily_challenge.id'), nullable=False)
    problem_type = db.Column(db.String(20), nullable=False)  # addition, subtraction, etc.
    operand1 = db.Column(db.Integer, nullable=False)
    operand2 = db.Column(db.Integer, nullable=False)
    user_answer = db.Column(db.Integer)
    correct_answer = db.Column(db.Integer, nullable=False)
    time_taken = db.Column(db.Float)  # seconds
    is_correct = db.Column(db.Boolean)

class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    module = db.Column(db.String(20), nullable=False)  # addition, subtraction, etc.
    difficulty_level = db.Column(db.Integer, default=1)
    accuracy = db.Column(db.Float, default=0.0)
    avg_time = db.Column(db.Float, default=0.0)
    problems_solved = db.Column(db.Integer, default=0)

# Problem Generators
def generate_addition_problem(difficulty_level):
    """Generate addition problem based on difficulty level"""
    if difficulty_level == 1:
        # Single digit addition
        a, b = random.randint(1, 9), random.randint(1, 9)
    elif difficulty_level == 2:
        # Two digit addition
        a, b = random.randint(10, 99), random.randint(10, 99)
    else:
        # Three digit addition
        a, b = random.randint(100, 999), random.randint(100, 999)
    
    return {
        'problem_type': 'addition',
        'operand1': a,
        'operand2': b,
        'correct_answer': a + b
    }

def generate_subtraction_problem(difficulty_level):
    """Generate subtraction problem based on difficulty level"""
    if difficulty_level == 1:
        # Single digit subtraction
        a, b = random.randint(5, 9), random.randint(1, 4)
        # Ensure positive result
        if a < b:
            a, b = b, a
    elif difficulty_level == 2:
        # Two digit subtraction
        a, b = random.randint(50, 99), random.randint(10, 49)
        # Ensure positive result
        if a < b:
            a, b = b, a
    else:
        # Three digit subtraction
        a, b = random.randint(500, 999), random.randint(100, 499)
        # Ensure positive result
        if a < b:
            a, b = b, a
    
    return {
        'problem_type': 'subtraction',
        'operand1': a,
        'operand2': b,
        'correct_answer': a - b
    }

def generate_multiplication_problem(difficulty_level):
    """Generate multiplication problem based on difficulty level"""
    if difficulty_level == 1:
        # Single digit multiplication
        a, b = random.randint(1, 9), random.randint(1, 9)
    elif difficulty_level == 2:
        # One digit by two digit
        a, b = random.randint(1, 9), random.randint(10, 99)
    else:
        # Two digit by two digit
        a, b = random.randint(10, 99), random.randint(10, 99)
    
    return {
        'problem_type': 'multiplication',
        'operand1': a,
        'operand2': b,
        'correct_answer': a * b
    }

def generate_division_problem(difficulty_level):
    """Generate division problem based on difficulty level"""
    if difficulty_level == 1:
        # Single digit division with whole number result
        b = random.randint(1, 9)
        a = b * random.randint(1, 9)  # Ensures whole number result
    elif difficulty_level == 2:
        # Two digit dividend, single digit divisor
        b = random.randint(1, 9)
        a = b * random.randint(10, 19)  # Ensures whole number result
    else:
        # Two digit dividend, two digit divisor
        b = random.randint(10, 19)
        a = b * random.randint(2, 9)  # Ensures whole number result
    
    return {
        'problem_type': 'division',
        'operand1': a,
        'operand2': b,
        'correct_answer': a // b
    }

# Problem generator mapping
PROBLEM_GENERATORS = {
    'addition': generate_addition_problem,
    'subtraction': generate_subtraction_problem,
    'multiplication': generate_multiplication_problem,
    'division': generate_division_problem
}

# Create tables
with app.app_context():
    # Create all tables first
    db.create_all()
    
    # Check if the database exists and if the is_default column exists
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    
    if 'user' in tables:
        # Check if is_default column exists
        columns = [column['name'] for column in inspector.get_columns('user')]
        if 'is_default' not in columns:
            # Add the is_default column
            try:
                # Use text() to create a proper SQL expression
                db.session.execute(text("ALTER TABLE user ADD COLUMN is_default BOOLEAN DEFAULT FALSE"))
                db.session.commit()
                print("Added is_default column to user table")
            except Exception as e:
                print(f"Error adding is_default column: {e}")
                db.session.rollback()
    
    # Check if we need to migrate the default user
    try:
        default_user = User.query.filter_by(username='default_user').first()
        if default_user:
            # Check if the is_default attribute exists and is False
            if not getattr(default_user, 'is_default', True):  # If it doesn't exist or is False
                default_user.is_default = True
                db.session.commit()
                print("Migrated default user")
    except Exception as e:
        print(f"Error migrating default user: {e}")
        db.session.rollback()

# Authentication Routes
@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    """Check if user is authenticated"""
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            # Handle case where is_default column might not exist
            is_default = getattr(user, 'is_default', False)
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'is_default': is_default
                }
            })
    return jsonify({'authenticated': False})

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login with username"""
    data = request.get_json()
    username = data.get('username')
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    try:
        # If this is the default user, update the record
        if username == 'default_user':
            user = User.query.filter_by(username='default_user').first()
            if user:
                # Handle case where is_default column might not exist
                if not hasattr(user, 'is_default') or not user.is_default:
                    user.is_default = True
            else:
                user = User(username='default_user', is_default=True)
                db.session.add(user)
        else:
            # Check if user exists
            user = User.query.filter_by(username=username).first()
            if not user:
                # Create new user
                user = User(username=username)
                db.session.add(user)
        
        db.session.commit()
        
        # Set session
        session['user_id'] = user.id
        
        # Handle case where is_default column might not exist
        is_default = getattr(user, 'is_default', False)
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'is_default': is_default
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.pop('user_id', None)
    return jsonify({'success': True})

# Helper function to get current user
def get_current_user():
    """Get current authenticated user"""
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None

# Updated API Routes
@app.route('/api/user', methods=['GET'])
def get_user():
    """Get the current user"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Calculate accuracy based on all problems (challenges + free run)
    accuracy = 0
    total_attempted = user.total_problems_solved  # Free run problems
    
    # Add challenge problems (5 per completed challenge)
    completed_challenges = DailyChallenge.query.filter_by(
        user_id=user.id, 
        completed=True
    ).count()
    total_attempted += completed_challenges * 5
    
    total_correct = user.total_correct_answers  # Free run correct answers
    # Add challenge correct answers
    completed_challenges_list = DailyChallenge.query.filter_by(
        user_id=user.id, 
        completed=True
    ).all()
    total_correct += sum(c.score or 0 for c in completed_challenges_list)
    
    if total_attempted > 0:
        accuracy = round((total_correct / total_attempted) * 100, 2)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'streak': user.streak,
        'max_streak': user.max_streak,
        'total_problems_attempted': total_attempted,
        'total_correct_answers': total_correct,
        'accuracy': accuracy
    })


@app.route('/api/user-stats', methods=['GET'])
def get_user_stats():
    """Get detailed user statistics"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Calculate challenge accuracy based on actual challenge scores
    challenge_accuracy = 0
    if user.total_challenges_completed > 0:
        # Get all completed challenges for this user
        completed_challenges = DailyChallenge.query.filter_by(
            user_id=user.id, 
            completed=True
        ).all()
        
        if completed_challenges:
            total_score = sum(c.score or 0 for c in completed_challenges)
            max_possible_score = len(completed_challenges) * 5  # 5 problems per challenge
            if max_possible_score > 0:
                challenge_accuracy = round((total_score / max_possible_score) * 100, 2)
    
    # Calculate free run accuracy (this is correct)
    free_run_accuracy = 0
    if user.total_problems_solved > 0:
        free_run_accuracy = round((user.total_correct_answers / user.total_problems_solved) * 100, 2)
    
    # Overall accuracy combines both challenge and free run
    overall_accuracy = 0
    total_attempted = user.total_problems_solved  # Free run problems
    # Add challenge problems (5 per completed challenge)
    completed_challenges = DailyChallenge.query.filter_by(
        user_id=user.id, 
        completed=True
    ).count()
    total_attempted += completed_challenges * 5
    
    total_correct = user.total_correct_answers  # Free run correct answers
    # Add challenge correct answers
    completed_challenges_list = DailyChallenge.query.filter_by(
        user_id=user.id, 
        completed=True
    ).all()
    total_correct += sum(c.score or 0 for c in completed_challenges_list)
    
    if total_attempted > 0:
        overall_accuracy = round((total_correct / total_attempted) * 100, 2)
    
    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'streak': user.streak,
            'max_streak': user.max_streak,
            'total_challenges_completed': user.total_challenges_completed,
            'total_problems_attempted': total_attempted,
            'total_correct_answers': total_correct,
            'overall_accuracy': overall_accuracy,
            'challenge_accuracy': challenge_accuracy,
            'free_run_accuracy': free_run_accuracy
        }
    })


@app.route('/api/challenge-stats', methods=['GET'])
def get_challenge_stats():
    """Get challenge-specific statistics"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Get recent challenges
    recent_challenges = DailyChallenge.query.filter_by(user_id=user.id)\
        .order_by(DailyChallenge.date.desc())\
        .limit(10)\
        .all()
    
    challenges_data = []
    for challenge in recent_challenges:
        challenges_data.append({
            'date': challenge.date.isoformat(),
            'completed': challenge.completed,
            'score': challenge.score
        })
    
    # Calculate challenge accuracy based on actual scores
    challenge_accuracy = 0
    completed_challenges = [c for c in recent_challenges if c.completed]
    if completed_challenges:
        total_score = sum(c.score or 0 for c in completed_challenges)
        max_possible_score = len(completed_challenges) * 5  # 5 problems per challenge
        if max_possible_score > 0:
            challenge_accuracy = round((total_score / max_possible_score) * 100, 2)
    
    # Get total problems attempted from challenges
    total_challenge_problems = len(completed_challenges) * 5
    
    return jsonify({
        'recent_challenges': challenges_data,
        'streak': user.streak,
        'max_streak': user.max_streak,
        'challenge_accuracy': challenge_accuracy,
        'total_problems_solved': total_challenge_problems
    })


@app.route('/api/free-run-stats', methods=['GET'])
def get_free_run_stats():
    """Get free run-specific statistics"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Calculate free run accuracy
    free_run_accuracy = 0
    if user.total_problems_solved > 0:
        free_run_accuracy = round((user.total_correct_answers / user.total_problems_solved) * 100, 2)
    
    return jsonify({
        'total_problems_solved': user.total_problems_solved,
        'total_correct_answers': user.total_correct_answers,
        'free_run_accuracy': free_run_accuracy
    })

@app.route('/api/weekly-challenges', methods=['GET'])
def get_weekly_challenges():
    """Get this week's challenges for the dashboard"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Get the start of the week (Monday)
    today = datetime.today().date()
    start_of_week = today - timedelta(days=today.weekday())
    
    challenges = []
    for i in range(7):
        date = start_of_week + timedelta(days=i)
        challenge = DailyChallenge.query.filter_by(user_id=user.id, date=date).first()
        
        if not challenge:
            # Create a new challenge if it doesn't exist
            challenge = DailyChallenge(date=date, user_id=user.id)
            db.session.add(challenge)
            db.session.commit()
        
        challenges.append({
            'date': date.isoformat(),
            'completed': challenge.completed,
            'score': challenge.score
        })
    
    return jsonify(challenges)

@app.route('/api/start-daily-challenge', methods=['POST'])
def start_daily_challenge():
    """Start today's daily challenge"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    today = datetime.today().date()
    challenge = DailyChallenge.query.filter_by(user_id=user.id, date=today).first()
    
    if not challenge:
        # Create today's challenge
        challenge = DailyChallenge(date=today, user_id=user.id)
        db.session.add(challenge)
        db.session.commit()
    
    if challenge.completed:
        return jsonify({"error": "Today's challenge is already completed"}), 400
    
    # Generate 5 problems (mixed from available modules)
    problems = []
    modules = ['addition', 'subtraction', 'multiplication', 'division']
    
    # For demo purposes, we'll use a fixed difficulty level
    # In a real app, this would be based on user progress
    difficulty_level = 1
    
    for i in range(5):
        module = random.choice(modules)
        generator = PROBLEM_GENERATORS.get(module)
        if generator:
            problem = generator(difficulty_level)
            problem['id'] = i + 1
            problems.append(problem)
    
    # Save problems to the database
    db_problems = []
    for problem_data in problems:
        problem = ChallengeProblem(
            challenge_id=challenge.id,
            problem_type=problem_data['problem_type'],
            operand1=problem_data['operand1'],
            operand2=problem_data['operand2'],
            correct_answer=problem_data['correct_answer']
        )
        db.session.add(problem)
        db_problems.append(problem)
    
    db.session.commit()
    
    # Add the actual database IDs to the problems data
    for i, problem in enumerate(db_problems):
        problems[i]['id'] = problem.id
    
    # Return the first problem
    return jsonify({
        'challenge_id': challenge.id,
        'current_problem': problems[0],
        'total_problems': len(problems),
        'current_problem_index': 1
    })

@app.route('/api/submit-answer', methods=['POST'])
def submit_answer():
    """Submit an answer for a problem in the daily challenge"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    challenge_id = data.get('challenge_id')
    problem_id = data.get('problem_id')
    user_answer = data.get('user_answer')
    time_taken = data.get('time_taken', 0)
    
    # Find the problem by ID
    problem = ChallengeProblem.query.get(problem_id)
    
    if not problem or problem.challenge_id != challenge_id:
        return jsonify({'error': 'Problem not found'}), 404
    
    # Verify the challenge belongs to the current user
    challenge = DailyChallenge.query.get(challenge_id)
    if challenge.user_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if answer is correct
    is_correct = (user_answer == problem.correct_answer)
    
    # Update problem with user's answer
    problem.user_answer = user_answer
    problem.time_taken = time_taken
    problem.is_correct = is_correct
    
    db.session.commit()
    
    # Get all problems for this challenge to determine next step
    all_problems = ChallengeProblem.query.filter_by(challenge_id=challenge_id).order_by(ChallengeProblem.id).all()
    current_index = all_problems.index(problem)
    
    # Check if this was the last problem
    if current_index == len(all_problems) - 1:
        # Challenge is complete
        challenge.completed = True
        
        # Calculate score (number of correct answers)
        correct_count = sum(1 for p in all_problems if p.is_correct)
        challenge.score = correct_count
        
        # Update streak if applicable
        yesterday = datetime.today().date() - timedelta(days=1)
        yesterday_challenge = DailyChallenge.query.filter_by(
            user_id=user.id, 
            date=yesterday
        ).first()
        
        if yesterday_challenge and yesterday_challenge.completed:
            user.streak += 1
        else:
            user.streak = 1
            
        # Update max streak if current streak is greater
        if user.streak > user.max_streak:
            user.max_streak = user.streak
            
        # Update user stats
        user.total_challenges_completed += 1
        user.total_problems_solved += len(all_problems)
        user.total_correct_answers += correct_count
        user.last_challenge_date = datetime.today().date()
        
        db.session.commit()
        
        return jsonify({
            'completed': True,
            'score': correct_count,
            'total_problems': len(all_problems)
        })
    
    # Return next problem
    next_problem = all_problems[current_index + 1]
    return jsonify({
        'completed': False,
        'next_problem': {
            'id': next_problem.id,
            'problem_type': next_problem.problem_type,
            'operand1': next_problem.operand1,
            'operand2': next_problem.operand2,
            'correct_answer': next_problem.correct_answer
        },
        'current_problem_index': current_index + 2,
        'total_problems': len(all_problems)
    })

@app.route('/api/submit-free-run-answer', methods=['POST'])
def submit_free_run_answer():
    """Submit an answer for a problem in a free run session"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    session_id = data.get('session_id')
    user_answer = data.get('user_answer')
    time_taken = data.get('time_taken', 0)
    
    # Check if session exists
    if session_id not in free_run_sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    session = free_run_sessions[session_id]
    
    # Verify the session belongs to the current user
    if session['user_id'] != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    current_index = session['current_index']
    problems = session['problems']
    current_problem = problems[current_index]
    
    # Check if answer is correct
    is_correct = (user_answer == current_problem['correct_answer'])
    
    # Update session stats
    if is_correct:
        session['correct_answers'] += 1
    
    # Check if this was the last problem
    if current_index == len(problems) - 1:
        # Free run session is complete
        accuracy = round((session['correct_answers'] / session['total_problems']) * 100, 2)
        
        # Update user stats
        user.total_problems_solved += session['total_problems']
        user.total_correct_answers += session['correct_answers']
        db.session.commit()
        
        # Remove session
        del free_run_sessions[session_id]
        
        return jsonify({
            'completed': True,
            'score': session['correct_answers'],
            'total_problems': session['total_problems'],
            'accuracy': accuracy
        })
    
    # Move to next problem
    session['current_index'] += 1
    next_problem = problems[session['current_index']]
    
    return jsonify({
        'completed': False,
        'next_problem': next_problem,
        'current_problem_index': session['current_index'] + 1,
        'total_problems': session['total_problems']
    })


@app.route('/api/free-run-config', methods=['GET'])
def get_free_run_config():
    """Get configuration options for free run mode"""
    return jsonify({
        'modules': ['addition', 'subtraction', 'multiplication', 'division'],
        'difficulty_levels': [1, 2, 3],
        'problem_counts': [5, 10, 15, 20]
    })

# Add a global variable to store free run sessions (in a real app, this would be stored in a database)
free_run_sessions = {}

@app.route('/api/start-free-run', methods=['POST'])
def start_free_run():
    """Start a free run session"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    print(f"Received data: {data}")  # Debug print
    modules = data.get('modules', ['addition'])
    difficulty_level = data.get('difficulty_level', 1)
    problem_count = data.get('problem_count', 5)
    
    print(f"Modules: {modules}, Difficulty: {difficulty_level}, Count: {problem_count}")  # Debug print
    
    # Generate problems
    problems = []
    for i in range(problem_count):
        module = random.choice(modules)
        generator = PROBLEM_GENERATORS.get(module)
        if generator:
            problem = generator(difficulty_level)
            problem['id'] = i + 1
            problems.append(problem)
    
    print(f"Generated {len(problems)} problems")  # Debug print
    
    # Create a session ID for this free run
    import uuid
    session_id = str(uuid.uuid4())
    
    # Store the session
    free_run_sessions[session_id] = {
        'user_id': user.id,
        'problems': problems,
        'current_index': 0,
        'correct_answers': 0,
        'total_problems': len(problems),
        'modules': modules,
        'difficulty_level': difficulty_level
    }
    
    # Return the first problem and session ID
    return jsonify({
        'session_id': session_id,
        'current_problem': problems[0],
        'current_problem_index': 1,
        'total_problems': len(problems)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)