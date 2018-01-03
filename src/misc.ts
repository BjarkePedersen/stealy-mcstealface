export const keys = <T>(a: T) => Object.keys(a) as (keyof T)[]
export const values = <T>(a: T) => (Object.keys(a) as (keyof T)[]).map(key => a[key])
