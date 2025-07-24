export interface RequestFile {
  fileName: string
}


export interface RequestBody {
  isBinary?: boolean
  content?: string | RequestFile[]
}
