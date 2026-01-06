import { useState, useCallback } from 'react';

[cite_start]// [cite: 17, 18, 19, 20, 21, 22]
export const useUndoableState = (initialValue) => {
    const [history, setHistory] = useState([]);
    const [future, setFuture] = useState([]);
    const [state, setState] = useState(initialValue);

    const setStateWithHistory = useCallback((newStateOrUpdater) => {
        setHistory((prev) => [...prev, state]);
        setFuture([]); 
        setState((prev) => typeof newStateOrUpdater === 'function' ? newStateOrUpdater(prev) : newStateOrUpdater);
    }, [state]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        setFuture((prev) => [state, ...prev]); 
        setHistory(newHistory);
        setState(previousState);
    }, [history, state]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const nextState = future[0];
        const newFuture = future.slice(1);
        setHistory((prev) => [...prev, state]); 
        setFuture(newFuture);
        setState(nextState);
    }, [future, state]);

    return [state, setStateWithHistory, undo, redo, history.length > 0, future.length > 0];
};