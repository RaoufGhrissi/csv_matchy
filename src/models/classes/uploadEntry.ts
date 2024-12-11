import { Cell } from "./cell";

export class UploadEntry {
    lines: {[key: string]: Cell;} [] = [];

    constructor(lines: {[key: string]: Cell;} []) {
        this.lines = lines;
    }
}