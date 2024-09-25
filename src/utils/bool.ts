export const BOOL_VALIDATOR = (value: string | boolean): boolean => ([true, false, 'true', 'false'].includes(value))

export const IS_TRUE = (value: string | boolean): boolean => ([true, 'true'].includes(value))
