export const ResponseCodeDotVariants = ['2xx', '4xx'] as const
export type ResponseCode = typeof ResponseCodeDotVariants[number]

export const ResponseCodeDotSizeVariants = ['small', 'large'] as const
export type ResponseCodeDotSize = typeof ResponseCodeDotSizeVariants[number]
