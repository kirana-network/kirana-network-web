import { isEqual, pick, isEmpty } from 'lodash';
import { useState, useEffect } from 'react';
import { getLoggingInstance } from './utils/logger';

// Our hook
export function useDebounce(value: any, delay: number) {
    // State and setters for debounced value
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(
        () => {
            // Set debouncedValue to value (passed in) after the specified delay
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            // Return a cleanup function that will be called every time
            // useEffect is re-called. useEffect will only be re-called
            // if value changes (see the inputs array below). 
            // This is how we prevent debouncedValue from changing if value is
            // changed within the delay period.
            // To put it in context, if the user is typing within our app's
            // search box, we don't want the debouncedValue to update until
            // they've stopped typing for more than 500ms.
            return () => {
                clearTimeout(handler);
            };
        },
        // Only re-call effect if value changes
        // You could also add the "delay" var to inputs array if you
        // need to be able to change that dynamically.
        [value]
    );

    return debouncedValue;
}

export type SavingState = "NONE" | "SAVING" | "SAVED";
type PartialAutoUpdateFormProps<T> = {
    record: T,
    fields: string[],
    action: (record: T, previous: T) => Promise<T>,
    _then: (result: any) => void,
    _catch: (error: any) => void,
    _finally: () => void,
    disabled?: boolean,
    /** wait duration before the partialForm attempts to save data */
    wait?: number,
};
export function usePartialAutoUpdateForm<T>(props: PartialAutoUpdateFormProps<T>) {
    const {
        record, action, _then, _catch, _finally, fields, disabled, wait
    } = props;
    const [partialRecord, setPartialRecord] = useState<any>({});
    const debouncedRecord = useDebounce(partialRecord, wait || 1000);
    const [savingState, setSavingState] = useState<SavingState>("NONE");
    const debouncedSavingState: SavingState = useDebounce(savingState, 1000);
    const l = getLoggingInstance(usePartialAutoUpdateForm.name);

    function save(recordToSave: T) {
        if (disabled) {
            return Promise.resolve(record);
        }
        l.trace("saveCalled", {
            recordToSave, record, isEmpty: isEmpty(recordToSave),
            obs: [pick(record, fields), pick(recordToSave, fields)]
        });
        if (isEmpty(recordToSave)) {
            return Promise.resolve(record);
        }

        if (isEqual(
            pick(record, fields),
            pick(recordToSave, fields)
        )) {
            return Promise.resolve(recordToSave);
        }
        else {
            setSavingState("SAVING");
            return action(recordToSave, record);
        }
    }

    useEffect(() => {
        if (debouncedSavingState === "SAVED") {
            setSavingState(undefined as any);
        }
    }, [debouncedSavingState]);

    useEffect(() => {
        save(partialRecord)
            .then(_then)
            .catch(_catch)
            .finally(() => {
                setSavingState("SAVED");
                _finally();
            });
    }, [debouncedRecord]);

    useEffect(() => {
        if (fields.length === 0) {
            l.warn("No fields provided");
        }
        setPartialRecord(pick(record, fields));
    }, [record]);

    return {
        savingState, debouncedRecord,
        setPartialRecord, partialRecord
    }
}

// export function usePartialForm<T>(props: PartialAutoUpdateFormProps<T>) {
//     const {
//         record, action, _then, _catch, _finally, fields
//     } = props;
//     const [partialRecord, setPartialRecord] = useState<T>({} as T);
//     const [savingState, setSavingState] = useState<SavingState>("NONE");
//     const debouncedSavingState: SavingState = useDebounce(savingState, 1000);
//     const l = getLoggingInstance(usePartialForm.name);

//     function save() {
//         l.trace("saveCalled", {
//             partialRecord, record, isEmpty: isEmpty(partialRecord),
//             obs: [pick(record, fields), pick(partialRecord, fields)]
//         });
//         const resolvedAction = (() => {
//             if (isEmpty(partialRecord)) {
//                 l.trace("isEmpty")
//                 return Promise.resolve(partialRecord);
//             }
//             else {
//                 l.trace("action")
//                 setSavingState("SAVING");
//                 return action(partialRecord);
//             }
//         })();

//         resolvedAction
//             .then(_then)
//             .catch(_catch)
//             .finally(() => {
//                 setSavingState("SAVED");
//                 _finally();
//             });
//     }

//     useEffect(() => {
//         if (debouncedSavingState === "SAVED") {
//             setSavingState(undefined as any);
//         }
//     }, [debouncedSavingState]);

//     useEffect(() => {
//         if (fields.length === 0) {
//             l.warn("No fields provided");
//         }
//         setPartialRecord(pick(record, fields) as any);
//     }, []);

//     useEffect(() => {
//         l.warn("PartialRecord", { partialRecord });
//     }, [partialRecord]);

//     return {
//         savingState, save,
//         setPartialRecord, partialRecord
//     }
// }