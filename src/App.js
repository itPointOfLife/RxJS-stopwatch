import React from 'react';
import styles from './styles.css';
import { fromEvent, timer, of, interval, BehaviorSubject } from 'rxjs';
import {
  map,
  bufferCount,
  filter,
  flatMapLatest,
  mergeMap,
  takeWhile,
  debounce,
  buffer,
} from 'rxjs/operators';

// let lastStoppedValue = 0;
// const source = timer(0, 1000).pipe(map((v) => v + lastStoppedValue));
// source.subscribe((data) => console.log(data));

function App() {
  const stopStartBtn = React.useRef(null);
  const waitBtn = React.useRef(null);
  const resetBtn = React.useRef(null);

  const [time, setTime] = React.useState(0);

  React.useEffect(() => {
    let isStart = false;
    let isWait = false;
    let isReset = false;
    let latestValue = 0;

    const stopwatch$ = new BehaviorSubject('');
    const timer$ = interval(1000).pipe(
      map((v) => v + latestValue),
      takeWhile((v) => {
        if (isWait) {
          isWait = false;
          latestValue = v;
        }
        return isStart;
      }),
    );

    const stopStart$ = fromEvent(stopStartBtn.current, 'click')
      .pipe(
        mergeMap(() => {
          console.log('Stop/Start Clicked');
          isStart = !isStart;
          if (!isStart) latestValue = 0;
          if (isReset) {
            isReset = false;
            latestValue = 0;
            console.log('isReset set to true in stop/start');
          }
          return timer$;
        }),
      )
      .subscribe((v) => {
        if (!isReset) stopwatch$.next(v);
      });

    const wait$ = fromEvent(waitBtn.current, 'click');
    wait$
      .pipe(
        buffer(wait$.pipe(debounce(() => timer(250)))),
        filter((clickArray) => {
          const isDoubleClick = clickArray.length === 2;
          if (isDoubleClick) {
            isWait = true;
            isStart = false;
          }
          return isDoubleClick;
        }),
      )
      .subscribe(() => {
        console.log('Wait Clicked!');
        isReset = false;
      });

    const reset$ = fromEvent(resetBtn.current, 'click')
      .pipe(
        mergeMap(() => {
          console.log('Reset Clicked');
          isReset = true;
          isStart = true;
          latestValue = 0;
          return timer$;
        }),
      )
      .subscribe((v) => stopwatch$.next(v));

    stopwatch$.subscribe((v) => {
      setTime(v);
    });
    return () => {
      stopwatch$.unsubscribe();
      stopStart$.unsubscribe();
      timer$.unsubscribe();
      wait$.unsubscribe();
      reset$.unsubscribe();
    };
  }, []);

  return (
    <div className="App">
      <p className="app-title">Stopwatch</p>
      <p className="app-timer">
        {Math.floor(time / 3600)
          ? time / 3600 >= 10
            ? Math.floor(time / 3600)
            : '0' + Math.floor(time / 3600)
          : '00'}{' '}
        :
        {Math.floor(time / 60)
          ? time / 60 >= 10
            ? Math.floor(time / 60)
            : '0' + Math.floor(time / 60)
          : '00'}{' '}
        :{time % 60 >= 10 ? time % 60 : '0' + (time % 60)}
      </p>
      <div className="buttons">
        <button ref={stopStartBtn}>Start/Stop</button>
        <button ref={waitBtn}>Wait</button>
        <button ref={resetBtn}>Reset</button>
      </div>
    </div>
  );
}

export default App;
