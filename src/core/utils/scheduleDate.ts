import dayjs from "dayjs";
import { ScheduleDate } from "../apiClient";
import { getLoggingInstance } from "./logger";

const logger = getLoggingInstance();

function fromJson(scheduleDate: ScheduleDate) {
    if (scheduleDate) {
        return dayjs()
            .set("year", scheduleDate.year)
            .set("month", scheduleDate.month)
            .set("date", scheduleDate.date)
            .set("hour", scheduleDate.hour)
            .set("minute", scheduleDate.minute)
            .set("second", scheduleDate.second)
            .set("millisecond", 0)
    }
    return null;
}

function calendarToday() {
    return toCalendarDate(dayjs());
}

function toCalendarDate(date: dayjs.Dayjs | Date) {
    return dayjs(date)
        .set("hour", 0)
        .set("minute", 0)
        .set("second", 0)
        .set("millisecond", 0);
}

function isToday(scheduleDate: ScheduleDate) {
    return isSameDate(scheduleDate, calendarToday());
}

function isSameDate(scheduleDate: ScheduleDate, date: dayjs.Dayjs) {
    if (scheduleDate) {
        const today = date.toJSON();
        const compareDate = fromJson({ ...scheduleDate, hour: 0, minute: 0, second: 0 }).toJSON();
        logger.trace("comparing", { today, compareDate });
        return today == compareDate;
    }
    return null;
}

function toScheduleDate(day: dayjs.Dayjs): ScheduleDate {
    return {
        year: day.year(),
        month: day.month(),
        date: day.date(),
        hour: day.hour(),
        minute: day.minute(),
        second: day.second()
    };
}

export default {
    fromJson,
    isToday,
    calendarToday,
    toCalendarDate,
    isSameDate,
    toScheduleDate,
}