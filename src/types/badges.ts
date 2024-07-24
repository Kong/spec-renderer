export const MethodVariants = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'connect', 'trace'] as const
export type Method = typeof MethodVariants[number]

export const BadgeSizeVariants = ['small', 'large'] as const
export type BadgeSize = typeof BadgeSizeVariants[number]

export const LabelBadgeTypeVariants = ['neutral', 'primary'] as const
export type LabelBadgeType = typeof LabelBadgeTypeVariants[number]
