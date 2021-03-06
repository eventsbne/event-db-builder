const async = require('async');
const request = require('request');
const createId = require('./createId');
const topicCategories = {
  tech: 292,
  lgbtq: 585,
};

const dateNow = new Date();
function parseEvent(event){
  var venue = parseVenue(event.venue);
  var organizer = parseGroup(event.group);
  return{
    id: createId([event.id, 'meetup'].join()),
    organizer,
    venue,
    remoteId: event.id,
    remoteIdType: 'meetup',
    name: event.name,
    status: event.status,
    descriptionHtml: event.description,
    timeCreated: dateNow,
    timeStart: event.time,
    timeEnd: null,
    timeUpdated: dateNow,
    timeLastSeen: dateNow,
    countAttending: event.yes_rsvp_count,
    countCapacity: null,
    countWaitlist: event.waitlist_count,
    organizerId: organizer.id,
    venueId: venue.id,
    price: null,
    url: event.link,
    image: null,
    eventType: 'meetup',
  }
}

function parseVenue(venue){
  if(!venue) return {};
  return {
    id: createId([venue.id, 'meetup'].join()),
    remoteId: venue.id,
    remoteIdType: 'meetup',
    name: venue.name,
    lat: venue.lat,
    lon: venue.lon,
    url: null,
    contactAddress: venue.address_1,
    contactCity: venue.city,
    contactCountry: venue.localized_country_name,
    contactPhone: venue.phone,
  };
}

function parseGroup(group){
  return {
    id: createId([group.id, 'meetup'].join()),
    remoteId: group.id,
    remoteIdType: 'meetup',
    name: group.name,
    url: `https://meetup.com/${group.urlname}`,
    description: null,
    codeOfConduct: null,
  }
}

module.exports = function(options, callback){
  const { config, cache, db } = options;
  console.log('config', config);
  console.log('requesting meetup index');
  request(`https://api.meetup.com/find/upcoming_events?key=${config.meetup.key}&page=1000&topic_category=${topicCategories.tech}`, function(error, res, data){
    if(error) return callback(error);

    const parsed = JSON.parse(data);
    const rawEvents = parsed.events;
    const parsedEvents = rawEvents.map(parseEvent);
    async.eachSeries(parsedEvents, (event, done) => db.addEvent(event, done), callback);
  });
}
