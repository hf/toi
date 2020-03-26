import * as toi from '@toi/toi';

/**
 * Recursively generate meesage containing the reasons of failed validation.
 * 
 * @param error ValidationError from Toi
 * @param messageOverride override the 'prefix' of the message. By default it is 'toi.ValidationError:'
 */
export function generateErrorMessage(
    error: toi.ValidationError,
    messageOverride: string = 'toi.ValidationError:',
  ): string {
    if (Array.isArray(error.reasons)) {
      error.reasons.forEach((reason, index) => {
        return `${index}: ${generateErrorMessage(reason, messageOverride)}`;
      });
    } else if (error.reasons instanceof toi.ValidationError) {
      return generateErrorMessage(error.reasons, messageOverride);
    } else if (error.reasons) {
      Object.keys(error.reasons).forEach((key: any) => {
        messageOverride = `${messageOverride} \-> "${key}"`;
        if (error.reasons) {
          messageOverride = `${messageOverride} - ${error.message}: ${generateErrorMessage(error.reasons[key], messageOverride)}`;
        }
      });

      return messageOverride;
    }

    return error.message;
  }
  