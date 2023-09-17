import { test } from '@playwright/test';

test.describe('[DEV-18542] Bookings: Show booking details (name and email) on appointment calendar invites', () => {
   test.describe('I have booked an appointment ' , () => {
       test.describe('I inspect the calendar invite', () => {
           test('I see both organiser and attendee name and email');
       });
   });
   test.describe('I have booked an appointment ' , () => {
       test.describe('I inspect the calendar invite', () => {
           test('I see details of the booking');
       });
   });
   test.describe('I have had an appointment booked as the site owner ' , () => {
       test.describe('I inspect the calendar invite', () => {
           test('I see both organiser and attendee name and email');
       });
   });
   test.describe('I have had an appointment booked as the site owner ' , () => {
       test.describe('I inspect the calendar invite', () => {
           test('I see details of the booking');
       });
   });
});
