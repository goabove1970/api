import * as fs from 'fs';
import * as util from 'util';
export const readFile = util.promisify(fs.readFile);

export class FileReader {

  async ReadTest(): Promise<string[]> {
      return await this.Read('/Users/ievgenmelnychuk/Desktop/First/src/controllers/helper/debit.csv');
  }
  
  async Read(file: string): Promise<string[]> {
    const options = {
      encoding: 'utf8'
    };
    const data = await readFile(file, options);
    let data1 = data.split(/\n/);
    data1 = data1.splice(1);
    return data1;
  }
}

const rederService = new FileReader();
export default rederService;