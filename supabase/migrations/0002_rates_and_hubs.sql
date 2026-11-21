insert into public.service_rates(service, name, description, window_text, base_cents, per_mile_cents, lead_minutes, minutes_per_mile) values
 ('sprint','Sprint','One driver, direct, no stops','Pickup in about 30 minutes',6500,310,25,1.3),
 ('sameday','Same-day','Delivered within 4 hours','Delivered within 4 hours',3800,190,90,2.2),
 ('nfo','Next Flight Out','Driver to the airport, onto the next departure','Onto the next departing flight',21000,240,150,2.0),
 ('stat','STAT medical','Specimens and equipment with signed handoffs','Pickup in about 20 minutes',9500,360,20,1.4);

insert into public.locations(name, address, lat, lng, is_hub) values
 ('Schaumburg HQ','Schaumburg, IL',42.0334,-88.0834,true),
 ('O''Hare Cargo (ORD)','O''Hare International Airport cargo area, Chicago, IL',41.9786,-87.9048,true),
 ('Chicago Loop','The Loop, Chicago, IL',41.8819,-87.6278,true),
 ('Midway Cargo (MDW)','Midway International Airport cargo area, Chicago, IL',41.7868,-87.7522,true),
 ('Naperville','Naperville, IL',41.7508,-88.1535,true),
 ('Elgin','Elgin, IL',42.0354,-88.2826,true),
 ('Gurnee','Gurnee, IL',42.3703,-87.9020,true),
 ('Joliet','Joliet, IL',41.5250,-88.0817,true);
