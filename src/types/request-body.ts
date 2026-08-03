

export interface RequestFormField {
  name: string
  kind: 'text' | 'file' | 'json'
  required?: boolean
  multiple?: boolean
  value?: string
  files?: File[]
  description?: string
  contentType?: string
}

export interface RequestBody {
  isBinary?: boolean
  isMultipart?: boolean
  acceptedExt?: string
  content?: string | FileList | File[]
  formFields?: RequestFormField[]
}
