import { crypto } from 'https://deno.land/std@0.154.0/crypto/mod.ts';
import { parseDate, DateData } from './date.ts';
import { ContentLine, stringifyLines } from './stringify.ts';
import { parseRRule, RecurrenceRule } from './rrule.ts';

const calendarBegin: ContentLine = ['BEGIN', 'VCALENDAR'];

const calendarProps: ContentLine[] = [
  ['VERSION', '2.0'],
  ['PRODID', 'peron/simple_ics'],
  ['METHOD', 'PUBLISH'],
];

const calendarEnd: ContentLine = ['END', 'VCALENDAR'];

const eventBegin: ContentLine = ['BEGIN', 'VEVENT'];

const eventEnd: ContentLine = ['END', 'VEVENT'];

export class Event {
  constructor(protected config: EventConfig) {
    if (config.duration !== undefined) {
      // Duration is provided
      if (!(config.beginDate instanceof Date)) {
        // Convert beginDate to Date object
        config.beginDate = Date.constructor.apply(null, config.beginDate);
      }
      // Calculate endDate
      const endStamp =
        (config.beginDate.valueOf() as number) + config.duration * 1e3;
      config.endDate = new Date(endStamp);
    } else if (config.endDate === undefined) {
      // Neither duration nor endDate is provided
      throw new TypeError(
        'Invalid Event Config, either duration or endDate should be provided'
      );
    }
  }

  toLines(): ContentLine[] {
    const uid = crypto.randomUUID();
    const { title, desc, rrule, alarm } = this.config;

    const result = [
      eventBegin,
      ['UID', uid],
      ['DTSTAMP', parseDate(new Date())],
      ['DTSTART', parseDate(this.config.beginDate)],
      ['DTEND', parseDate(this.config.endDate!)],
      ['SUMMARY', title],
      ['DESCRIPTION', desc],
      ['RRULE', parseRRule(rrule)],
      ...parseAlarm(alarm),
      eventEnd,
    ].filter(line => line[1] !== undefined) as ContentLine[];

    return result;
  }
}

export class Calendar {
  constructor(protected events: Event[]) {}

  toLines(): ContentLine[] {
    const eventLines = this.events.map(evt => evt.toLines()).flat();

    return [calendarBegin, ...calendarProps, ...eventLines, calendarEnd];
  }

  toString() {
    return stringifyLines(this.toLines());
  }
}

export interface EventConfig {
  title: string;
  beginDate: DateData;
  endDate?: DateData;
  duration?: number;
  desc?: string;
  rrule?: RecurrenceRule;
  alarm?: AlarmConfig;
}

export interface AlarmConfig {
  advance: number; // In minutes
  desc: string;
}

export function parseAlarm(
  config?: AlarmConfig
): ContentLine[] | [[string, undefined]] {
  if (config === undefined) return [['VALARM', undefined]];

  return [
    ['BEGIN', 'VALARM'],
    ['TRIGGER', `-PT${config.advance}M`],
    ['ACTION', 'DISPLAY'],
    ['DESCRIPTION', config.desc],
    ['END', 'VALARM'],
  ];
}
