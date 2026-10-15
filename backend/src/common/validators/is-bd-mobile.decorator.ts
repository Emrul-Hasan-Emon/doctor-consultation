import { registerDecorator, ValidationOptions } from 'class-validator';
import { tryNormalizeMobile } from '../utils/mobile';

export function IsBdMobile(options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isBdMobile',
      target: target.constructor,
      propertyName,
      options: {
        message: 'must be a valid Bangladeshi mobile number',
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && tryNormalizeMobile(value) !== null,
      },
    });
}
