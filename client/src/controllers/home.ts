import { Request, Response } from 'express';
import rederService from './helper/fileresder';
import { parseChunk } from './helper/Chase/parser';
import getDataGridElement from '../containers/grid-containter';

/**
 * GET /
 * Home page.
 */
export const index = async (req: Request, res: Response) => {

    const records = await rederService.ReadTest();
    const parsed = records.map(parseChunk).filter(r => !!r);
    const dataGridElement = getDataGridElement({});
    // console.log(JSON.stringify(dataGridElement, null, 4));

    res.render('home', {
        title: 'Home',
        parsed,
        dataGridElement
    });
};
