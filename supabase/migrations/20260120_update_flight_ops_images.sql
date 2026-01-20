-- Update flight_ops_routes with HD city images based on destination

-- Dubai
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80' WHERE LOWER(destination) LIKE '%dubai%';

-- London
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80' WHERE LOWER(destination) LIKE '%london%';

-- Paris
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80' WHERE LOWER(destination) LIKE '%paris%';

-- New York
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80' WHERE LOWER(destination) LIKE '%new york%' OR LOWER(destination) LIKE '%nyc%' OR LOWER(destination) LIKE '%teterboro%' OR LOWER(destination) LIKE '%jfk%';

-- Miami
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=1200&q=80' WHERE LOWER(destination) LIKE '%miami%';

-- Los Angeles
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200&q=80' WHERE LOWER(destination) LIKE '%los angeles%' OR LOWER(destination) LIKE '%van nuys%' OR LOWER(destination) LIKE '%lax%';

-- Tokyo
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80' WHERE LOWER(destination) LIKE '%tokyo%';

-- Singapore
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80' WHERE LOWER(destination) LIKE '%singapore%';

-- Hong Kong
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1200&q=80' WHERE LOWER(destination) LIKE '%hong kong%';

-- Sydney
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80' WHERE LOWER(destination) LIKE '%sydney%';

-- Rome
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80' WHERE LOWER(destination) LIKE '%rome%' OR LOWER(destination) LIKE '%roma%';

-- Milan
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=1200&q=80' WHERE LOWER(destination) LIKE '%milan%';

-- Barcelona
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80' WHERE LOWER(destination) LIKE '%barcelona%';

-- Ibiza
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1573451903508-c6539dce5e89?w=1200&q=80' WHERE LOWER(destination) LIKE '%ibiza%';

-- Maldives
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80' WHERE LOWER(destination) LIKE '%maldives%' OR LOWER(destination) LIKE '%male%';

-- Monaco (Monte Carlo harbor)
UPDATE flight_ops_routes SET image_url = 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/heromonaco.webp' WHERE LOWER(destination) LIKE '%monaco%';

-- Nice
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1200&q=80' WHERE LOWER(destination) LIKE '%nice%';

-- Cannes
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&q=80' WHERE LOWER(destination) LIKE '%cannes%';

-- Zurich
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1200&q=80' WHERE LOWER(destination) LIKE '%zurich%' OR LOWER(destination) LIKE '%zürich%';

-- Geneva
UPDATE flight_ops_routes SET image_url = 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/589bc75d1b83a01b8588e7b6d12895b8ff254934-1600x1066.jpg' WHERE LOWER(destination) LIKE '%geneva%' OR LOWER(destination) LIKE '%genf%';

-- Amsterdam
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80' WHERE LOWER(destination) LIKE '%amsterdam%';

-- Vienna
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=80' WHERE LOWER(destination) LIKE '%vienna%' OR LOWER(destination) LIKE '%wien%';

-- Berlin
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&q=80' WHERE LOWER(destination) LIKE '%berlin%';

-- Munich
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1200&q=80' WHERE LOWER(destination) LIKE '%munich%' OR LOWER(destination) LIKE '%münchen%';

-- Frankfurt
UPDATE flight_ops_routes SET image_url = 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/GettyImages-601823765.jpg' WHERE LOWER(destination) LIKE '%frankfurt%';

-- Madrid
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=80' WHERE LOWER(destination) LIKE '%madrid%';

-- Lisbon
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&q=80' WHERE LOWER(destination) LIKE '%lisbon%' OR LOWER(destination) LIKE '%lisboa%';

-- Athens
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80' WHERE LOWER(destination) LIKE '%athens%';

-- Santorini
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80' WHERE LOWER(destination) LIKE '%santorini%';

-- Mykonos
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1200&q=80' WHERE LOWER(destination) LIKE '%mykonos%';

-- Istanbul
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80' WHERE LOWER(destination) LIKE '%istanbul%';

-- Moscow
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200&q=80' WHERE LOWER(destination) LIKE '%moscow%';

-- Bangkok
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80' WHERE LOWER(destination) LIKE '%bangkok%';

-- Bali
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80' WHERE LOWER(destination) LIKE '%bali%';

-- Phuket
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=80' WHERE LOWER(destination) LIKE '%phuket%';

-- Las Vegas
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=80' WHERE LOWER(destination) LIKE '%las vegas%' OR LOWER(destination) LIKE '%vegas%';

-- San Francisco
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80' WHERE LOWER(destination) LIKE '%san francisco%' OR LOWER(destination) LIKE '%sfo%';

-- Chicago
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1200&q=80' WHERE LOWER(destination) LIKE '%chicago%';

-- Aspen (Colorado ski resort town)
UPDATE flight_ops_routes SET image_url = 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/download.jpeg' WHERE LOWER(destination) LIKE '%aspen%';

-- St Moritz (Swiss Alps luxury ski resort)
UPDATE flight_ops_routes SET image_url = 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/Things-to-do-in-St-Moritz.jpeg' WHERE LOWER(destination) LIKE '%st moritz%' OR LOWER(destination) LIKE '%st. moritz%';

-- Cabo / Cancun
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200&q=80' WHERE LOWER(destination) LIKE '%cabo%' OR LOWER(destination) LIKE '%cancun%';

-- Caribbean / Bahamas
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200&q=80' WHERE LOWER(destination) LIKE '%caribbean%' OR LOWER(destination) LIKE '%bahamas%' OR LOWER(destination) LIKE '%nassau%';

-- Seychelles
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1589979481223-deb893043163?w=1200&q=80' WHERE LOWER(destination) LIKE '%seychelles%';

-- Mauritius
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80' WHERE LOWER(destination) LIKE '%mauritius%';

-- Sardinia
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=1200&q=80' WHERE LOWER(destination) LIKE '%sardinia%' OR LOWER(destination) LIKE '%olbia%';

-- Mallorca / Palma
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1200&q=80' WHERE LOWER(destination) LIKE '%mallorca%' OR LOWER(destination) LIKE '%palma%' OR LOWER(destination) LIKE '%majorca%';

-- St Tropez
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1200&q=80' WHERE LOWER(destination) LIKE '%tropez%';

-- Courchevel
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=80' WHERE LOWER(destination) LIKE '%courchevel%';

-- Gstaad
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80' WHERE LOWER(destination) LIKE '%gstaad%';

-- Lake Como
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1582656975587-93c0b7cbf0a3?w=1200&q=80' WHERE LOWER(destination) LIKE '%como%';

-- Amalfi
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493a?w=1200&q=80' WHERE LOWER(destination) LIKE '%amalfi%' OR LOWER(destination) LIKE '%naples%' OR LOWER(destination) LIKE '%napoli%';

-- Florence
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1543429258-c5ca3e3c0c60?w=1200&q=80' WHERE LOWER(destination) LIKE '%florence%' OR LOWER(destination) LIKE '%firenze%';

-- Venice
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&q=80' WHERE LOWER(destination) LIKE '%venice%' OR LOWER(destination) LIKE '%venezia%';

-- Copenhagen
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1200&q=80' WHERE LOWER(destination) LIKE '%copenhagen%';

-- Stockholm
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1200&q=80' WHERE LOWER(destination) LIKE '%stockholm%';

-- Oslo
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80' WHERE LOWER(destination) LIKE '%oslo%';

-- Dublin
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&q=80' WHERE LOWER(destination) LIKE '%dublin%';

-- Edinburgh
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1506377585622-bedcbb5f3f3b?w=1200&q=80' WHERE LOWER(destination) LIKE '%edinburgh%';

-- Brussels
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=1200&q=80' WHERE LOWER(destination) LIKE '%brussels%';

-- Prague
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=80' WHERE LOWER(destination) LIKE '%prague%';

-- Budapest
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=1200&q=80' WHERE LOWER(destination) LIKE '%budapest%';

-- Marrakech
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&q=80' WHERE LOWER(destination) LIKE '%marrakech%' OR LOWER(destination) LIKE '%morocco%';

-- Cape Town
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80' WHERE LOWER(destination) LIKE '%cape town%';

-- Boston
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=1200&q=80' WHERE LOWER(destination) LIKE '%boston%';

-- Palm Beach
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1200&q=80' WHERE LOWER(destination) LIKE '%palm beach%';

-- Washington DC
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=1200&q=80' WHERE LOWER(destination) LIKE '%washington%' OR LOWER(destination) LIKE '%d.c.%' OR LOWER(destination) LIKE '%dc%';

-- Dallas
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=1200&q=80' WHERE LOWER(destination) LIKE '%dallas%';

-- Houston
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=1200&q=80' WHERE LOWER(destination) LIKE '%houston%';

-- Austin
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1200&q=80' WHERE LOWER(destination) LIKE '%austin%';

-- Nashville
UPDATE flight_ops_routes SET image_url = 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/nashville.webp' WHERE LOWER(destination) LIKE '%nashville%';

-- Pittsburgh
UPDATE flight_ops_routes SET image_url = 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/Downtown%20Pittsburgh_AdobeStock_221230893_licensed_c_rs1000px.jpg' WHERE LOWER(destination) LIKE '%pittsburgh%';

-- Nantucket
UPDATE flight_ops_routes SET image_url = 'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/660c3c914ed7bbfb9ce64ef7_Nantucket%20Lighthouse.jpeg' WHERE LOWER(destination) LIKE '%nantucket%';

-- Martha's Vineyard
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=1200&q=80' WHERE LOWER(destination) LIKE '%martha%vineyard%' OR LOWER(destination) LIKE '%marthas vineyard%';

-- Telluride
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80' WHERE LOWER(destination) LIKE '%telluride%';

-- Jackson Hole
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1200&q=80' WHERE LOWER(destination) LIKE '%jackson hole%' OR LOWER(destination) LIKE '%jackson%';

-- Sun Valley
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=1200&q=80' WHERE LOWER(destination) LIKE '%sun valley%';

-- Turks & Caicos
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200&q=80' WHERE LOWER(destination) LIKE '%turks%' OR LOWER(destination) LIKE '%caicos%';

-- Anguilla
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&q=80' WHERE LOWER(destination) LIKE '%anguilla%';

-- Tulum
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200&q=80' WHERE LOWER(destination) LIKE '%tulum%';

-- Atlanta
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=1200&q=80' WHERE LOWER(destination) LIKE '%atlanta%';

-- Denver
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=1200&q=80' WHERE LOWER(destination) LIKE '%denver%';

-- Seattle
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=1200&q=80' WHERE LOWER(destination) LIKE '%seattle%';

-- Phoenix / Scottsdale
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80' WHERE LOWER(destination) LIKE '%phoenix%' OR LOWER(destination) LIKE '%scottsdale%';

-- Default luxury aviation image for any remaining null images
UPDATE flight_ops_routes SET image_url = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80' WHERE image_url IS NULL OR image_url = '';
