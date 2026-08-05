CREATE TABLE public.delivery_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.delivery_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_locations TO authenticated;
GRANT ALL ON public.delivery_locations TO service_role;

ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active delivery locations"
ON public.delivery_locations
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can insert delivery locations"
ON public.delivery_locations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update delivery locations"
ON public.delivery_locations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete delivery locations"
ON public.delivery_locations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_delivery_locations_updated_at
BEFORE UPDATE ON public.delivery_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_delivery_locations_order ON public.delivery_locations (display_order, name);

INSERT INTO public.delivery_locations (code, name, region, price, display_order) VALUES
('cbd','CBD (Free)','Nairobi CBD',0,0),
('ngara','Ngara','Nairobi',150,1),
('pangani','Pangani','Nairobi',200,2),
('westlands','Westlands','Nairobi',250,3),
('parklands','Parklands','Nairobi',250,4),
('kilimani','Kilimani','Nairobi',300,5),
('kileleshwa','Kileleshwa','Nairobi',300,6),
('lavington','Lavington','Nairobi',300,7),
('hurlingham','Hurlingham','Nairobi',300,8),
('upperhill','Upper Hill','Nairobi',250,9),
('south_b','South B','Nairobi',250,10),
('south_c','South C','Nairobi',250,11),
('nairobi_west','Nairobi West','Nairobi',250,12),
('karen','Karen','Nairobi',400,13),
('langata','Langata','Nairobi',350,14),
('runda','Runda','Nairobi',400,15),
('muthaiga','Muthaiga','Nairobi',350,16),
('gigiri','Gigiri','Nairobi',400,17),
('eastleigh','Eastleigh','Nairobi East',200,18),
('buruburu','Buruburu','Nairobi East',250,19),
('donholm','Donholm','Nairobi East',250,20),
('umoja','Umoja','Nairobi East',250,21),
('kayole','Kayole','Nairobi East',300,22),
('embakasi','Embakasi','Nairobi East',300,23),
('pipeline','Pipeline','Nairobi East',300,24),
('imara_daima','Imara Daima','Nairobi East',300,25),
('utawala','Utawala','Nairobi East',350,26),
('ruai','Ruai','Nairobi East',400,27),
('komarock','Komarock','Nairobi East',300,28),
('kasarani','Kasarani','Nairobi North',300,29),
('roysambu','Roysambu','Nairobi North',300,30),
('zimmerman','Zimmerman','Nairobi North',300,31),
('githurai','Githurai','Nairobi North',350,32),
('kahawa','Kahawa','Nairobi North',350,33),
('kahawa_sukari','Kahawa Sukari','Nairobi North',400,34),
('kahawa_wendani','Kahawa Wendani','Nairobi North',400,35),
('ruaka','Ruaka','Nairobi North',400,36),
('banana','Banana Hill','Nairobi North',400,37),
('ruiru','Ruiru','Kiambu',400,38),
('juja','Juja','Kiambu',450,39),
('thika','Thika','Kiambu',500,40),
('kiambu_town','Kiambu Town','Kiambu',450,41),
('kikuyu','Kikuyu','Kiambu',400,42),
('limuru','Limuru','Kiambu',500,43),
('kamiti','Kamiti','Kiambu',400,44),
('githunguri','Githunguri','Kiambu',500,45),
('ngong','Ngong','Kajiado',400,46),
('rongai','Rongai','Kajiado',350,47),
('kiserian','Kiserian','Kajiado',400,48),
('syokimau','Syokimau','Machakos',350,49),
('mlolongo','Mlolongo','Machakos',350,50),
('athi_river','Athi River','Machakos',400,51),
('kitengela','Kitengela','Kajiado',450,52),
('machakos','Machakos Town','Machakos',550,53),
('naivasha','Naivasha','Nakuru',700,54),
('nakuru','Nakuru','Nakuru',800,55),
('nyahururu','Nyahururu','Laikipia',900,56),
('nyeri','Nyeri','Nyeri',800,57),
('muranga','Murang''a','Murang''a',700,58),
('karatina','Karatina','Nyeri',800,59),
('embu','Embu','Embu',800,60),
('meru','Meru','Meru',900,61),
('nanyuki','Nanyuki','Laikipia',900,62),
('isiolo','Isiolo','Isiolo',1000,63),
('kisumu','Kisumu','Kisumu',1000,64),
('kericho','Kericho','Kericho',900,65),
('kisii','Kisii','Kisii',1000,66),
('kakamega','Kakamega','Kakamega',1000,67),
('bungoma','Bungoma','Bungoma',1000,68),
('busia','Busia','Busia',1000,69),
('eldoret','Eldoret','Uasin Gishu',1000,70),
('kitale','Kitale','Trans Nzoia',1100,71),
('narok','Narok','Narok',900,72),
('bomet','Bomet','Bomet',900,73),
('mombasa','Mombasa','Mombasa',1200,74),
('malindi','Malindi','Kilifi',1300,75),
('kilifi','Kilifi','Kilifi',1200,76),
('diani','Diani','Kwale',1300,77),
('lamu','Lamu','Lamu',1500,78),
('voi','Voi','Taita Taveta',1100,79),
('kitui','Kitui','Kitui',800,80),
('makueni','Makueni','Makueni',800,81),
('wote','Wote','Makueni',800,82),
('garissa','Garissa','Garissa',1200,83);