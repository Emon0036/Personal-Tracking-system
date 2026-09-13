import { emptyData, type Data } from './model'
import { validateData } from './validation'

let database: Promise<IDBDatabase> | undefined
function open(): Promise<IDBDatabase> {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('personal-os', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('state')
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined }; resolve(request.result) }
    request.onerror = () => { database = undefined; reject(request.error ?? new Error('Could not open local storage.')) }
    request.onblocked = () => { database = undefined; reject(new Error('Close other Personal OS tabs, then try again.')) }
  })
  return database
}
// Read-modify-write in one transaction prevents lost updates between tabs.
export async function transact(change?: (current: Data) => Data): Promise<Data> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', change ? 'readwrite' : 'readonly')
    const store = tx.objectStore('state')
    const request = store.get('data')
    let result: Data
    let failure: unknown
    request.onsuccess = () => {
      try {
        result = request.result === undefined ? emptyData() : validateData(request.result)
        if (change) { result = validateData(change(result)); store.put(result, 'data') }
      } catch (error) { failure = error; tx.abort() }
    }
    tx.oncomplete = () => resolve(result)
    tx.onabort = tx.onerror = () => reject(failure ?? tx.error ?? new Error('Local storage could not save your changes. Check available browser storage.'))
  })
}
