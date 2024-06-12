import type { IHttpPathParam } from '@stoplight/types'

export const extractSample = (data: IHttpPathParam[] | undefined):Record<string, any> => {
  const samples = <Record<string, any>>{}

  data?.forEach(d => {
    //@ts-ignore there might be undocumented untyped property that holds the expample for the specific field
    let exampleValue = d.example
    if (exampleValue) {
      samples[d.name] = exampleValue
      return
    }
    if (d.schema?.examples) {
      //@ts-ignore  we are not sure what type this sucker is
      exampleValue = d.schema?.examples[0]
      if (exampleValue) {
        samples[d.name] = exampleValue
        return
      }
    }

  })
  return samples
}