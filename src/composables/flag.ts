import { computed_property, ref } from "@lib/";
import _ from 'lodash';

export function useFlag(initial = false) {
    const flag = ref<boolean>(initial);

    return {
        value: computed_property<boolean>(flag.value),

        execute_sync(cb: () => void) {
            try {
                flag.value = true;
                cb();
            }
            finally {
                flag.value = false;
            }
        },

        async execute(cb: () => Promise<void>) {
            try {
                flag.value = true;
                await cb();
            }
            finally {
                flag.value = false;
            }
        },
    }
}