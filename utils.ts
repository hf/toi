import * as toi from '@toi/toi';

/**
 * 
 * @param error ValidationError from Toi
 * 
 * Recursively prints the reasons when a validation fails.
 */
export function printError(error: toi.ValidationError) {
    if (Array.isArray(error.reasons)) {
        error.reasons.forEach((reason, index) => {
            console.log(`${index}: `);
            printError(reason);
        });
    } else if (error.reasons instanceof toi.ValidationError) {
        printError(error.reasons);
    } else if (error.reasons) {
        Object.keys(error.reasons).forEach((key: any) => {
            console.log(key);
            if (error.reasons) { 
                printError(error.reasons[key]); 
            }
        });
    }
}