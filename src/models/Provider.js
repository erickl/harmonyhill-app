import BaseModel from "./BaseModel.js";
import * as utils from "../utils.js";

export class Provider extends BaseModel {
    static COLLECTION = "providers";

    constructor(name, phoneNumber, activity) {   
        this.name = name.trim();
        this.phoneNumber = phoneNumber.trim();
        this.activity = activity.trim();

        super("providers");

        this.id = id();
    }

    id() {
        return `${this.activity}-${this.name.replace(/ /g, "-")}`
    }

    data() {
        return {
            "name"        : this.name,
            "phoneNumber" : this.phoneNumber,
            "activity"    : this.activity,
        }
    }

    async upload(onError) {
        if(utils.isEmpty(this.id)) {
            onError("ID is empty");
            return false;
        }

        const data = this.data();

        try {
            const uploadSuccess = await dao.add([Provider.COLLECTION], this.id, data);
            return uploadSuccess;
        } catch(e) {
            onError(`Error on dish upload ${this.id}: ${e.message}`);
            return false;
        }
    } 
}

export async function seed() {
    const providers = [
        new Provider("Rena", "", "transport"),
        new Provider("Pebi", "", "yoga"),
    ]
}

//await seed();