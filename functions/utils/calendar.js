import ICAL from 'ical.js';

export function parseICal(rawICalData) {
    const jcalData = ICAL.parse(rawICalData);
    
    const components = new ICAL.Component(jcalData);
    const vEvents = components.getAllSubcomponents('vevent');

    const events = vEvents.map(event => {
        const item = new ICAL.Event(event);
        return {
            summary: item.summary,
            start: item.startDate.toJSDate(),
            end: item.endDate.toJSDate()
        };
    });

    return events;
}
