export const MethodVariants = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'connect', 'trace'] as const
export type Method = typeof MethodVariants[number]

export const BadgeSizeVariants = ['small', 'large'] as const
export type BadgeSize = typeof BadgeSizeVariants[number]

export const VersionBadgeTypeVariants = ['neutral', 'primary'] as const
export type VersionBadgeType = typeof VersionBadgeTypeVariants[number]
