import * as utils from "../utils.js";

class ActivityStatus {
    Status = Object.freeze({
        "none":                       0,
        "pending guest confirmation": 100,
        "guest confirmed":            200,
        "details missing":            300,
        "please book with provider":  400,
        "assign staff":               500,
        "staff not confirmed":        600,
        "good to go":                 700,
        "started":                    800,
        "completed":                  900,
        "overdue":                    1000,
        "awaiting commission":        1100,
        "remove commission":          1200,
        "awaiting expense":           1300,
        "remove expense":             1400,
        
    });

    constructor(value, message = "") {
        this.name = "none";
        this.code = this.Status[value];

        if(typeof value === "string") {
            if(utils.exists(this.Status, value)) {
                this.name = value;
                this.code = this.Status[value];
            } 
        } else if(typeof value === "number") {
            for(const [name, code] of Object.entries(this.Status)) {
                if(code === value) {
                    this.name = name;
                    this.code = value;
                    break;
                }
            }
        }

        this.message = utils.isEmpty(message) ? this.name : message;
    }

    instance(value) {
        if(utils.isEmpty(value)) {
            return null;
        } else if(typeof value === "string" || typeof value === "number") {
            return new ActivityStatus(value);       
        } else if(value instanceof ActivityStatus) {
           return value;
        } else if(utils.exists(value, "status")) {
            return new ActivityStatus(value.status);
        }
        return null;
    }

    equals(value) {
        return this.compare(value) === 0;
    }

    withMessage(message) {
        this.message = message;
        return this;
    }

    compare(value) {
        const input = this.instance(value);
        if(input === null) return 1;
        if(input.code < this.code) return 1;
        if(input.code > this.code) return -1;
        return 0; // equals
    }

    lessThan(value) {
        return this.compare(value) < 0;
    }

    lessThanOrEqual(value) {
        return this.compare(value) <= 0;
    }

    greaterThan(value) {
        return this.compare(value) > 0;
    }

    greaterThanOrEqual(value) {
        return this.compare(value) >= 0;
    }
}

export const GoodToGo                 = new ActivityStatus("good to go"                 ); 
export const PendingGuestConfirmation = new ActivityStatus("pending guest confirmation" ); 
export const GuestConfirmed           = new ActivityStatus("guest confirmed"            ); 
export const BookProvider             = new ActivityStatus("please book with provider"  ); 
export const AssignStaff              = new ActivityStatus("assign staff"               ); 
export const StaffNotConfirmed        = new ActivityStatus("staff not confirmed"        ); 
export const DetailsMissing           = new ActivityStatus("details missing"            ); 
export const Started                  = new ActivityStatus("started"                    ); 
export const Completed                = new ActivityStatus("completed"                  ); 
export const AwaitingCommission       = new ActivityStatus("awaiting commission"        ); 
export const RemoveCommission         = new ActivityStatus("remove commission"          ); 
export const AwaitingExpense          = new ActivityStatus("awaiting expense"           ); 
export const RemoveExpense            = new ActivityStatus("remove expense"             ); 
export const None                     = new ActivityStatus("none",                      ); 
