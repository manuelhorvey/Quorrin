import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, render_template
import threading
import time
from datetime import datetime
from paper_trading.engine import PaperTradingEngine

app = Flask(__name__, template_folder='../paper_trading/templates')
engine = PaperTradingEngine()
_lock = threading.Lock()
_engine_status = {
    'initialized': False,
    'initializing': False,
    'last_error': None,
    'start_time': datetime.now().isoformat(),
}


def init_engine():
    global _engine_status
    with _lock:
        if _engine_status['initialized'] or _engine_status['initializing']:
            return
        _engine_status['initializing'] = True

    try:
        engine.initialize()
        engine.run_once()
        with _lock:
            _engine_status['initialized'] = True
            _engine_status['initializing'] = False
        print('Engine initialized successfully')
    except Exception as e:
        with _lock:
            _engine_status['initializing'] = False
            _engine_status['last_error'] = str(e)
        print(f'Engine init failed: {e}')


def background_refresh():
    while True:
        time.sleep(1800)
        try:
            with _lock:
                if _engine_status['initialized']:
                    engine.run_once()
        except Exception as e:
            print(f'Refresh error: {e}')


@app.route('/')
def dashboard():
    return render_template('dashboard.html')


@app.route('/api/state')
def api_state():
    with _lock:
        try:
            state = engine.get_state()
            state['engine_status'] = dict(_engine_status)
            return jsonify(state)
        except Exception as e:
            return jsonify({
                'engine_status': dict(_engine_status),
                'portfolio': {'total_value': 0, 'total_return': 0, 'days_running': 0,
                              'start_date': '', 'last_update': None, 'capital': 100000,
                              'allocations': {'XLF': 0.6, 'BTC': 0.4},
                              'deployment_cleared': True},
                'assets': {},
                'halt_conditions': {'drawdown': -0.08, 'monthly_pf': 0.7, 'signal_drought': 30, 'prob_drift': 0.15},
                'error': str(e),
            })


@app.route('/api/run')
def api_run():
    if not _engine_status['initialized']:
        return jsonify({'error': 'Engine not initialized', 'status': _engine_status})
    with _lock:
        result = engine.run_once()
    return jsonify(result)


def main():
    print('=' * 60)
    print('  QuantForge Paper Trading Command Center')
    print('=' * 60)
    print()

    init_thread = threading.Thread(target=init_engine, daemon=True)
    init_thread.start()

    refresh_thread = threading.Thread(target=background_refresh, daemon=True)
    refresh_thread.start()

    print('Starting dashboard server...')
    print(f'Dashboard: http://127.0.0.1:5000')
    print(f'API:       http://127.0.0.1:5000/api/state')
    print()
    print('Models are training in the background.')
    print('Dashboard will update automatically when ready.')
    print()

    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)


if __name__ == '__main__':
    main()
