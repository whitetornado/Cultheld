# Cultheld.nl - Product Concept

## 📦 Hoe werkt het?

Cultheld.nl verkoopt unieke kledingstukken met custom legends erop. Het concept bestaat uit 3 componenten:

### 1. Legend (PNG Illustratie)
- Minimalistiche illustraties van voetballegends
- Transparante achtergrond (PNG)
- Verschillende poses en stijlen
- Locatie: `public/legends/*.png`

**Voorbeelden:**
- `/legends/legend.png` - Speler in actie (groen/wit shirt)
- `/legends/legend copy.png` - Alternatieve pose
- `/legends/afe0f531-76dd-4f05-af43-0c5fe6d1eca6.png` - Andere speler

### 2. Blank Kledingstuk
- Basis t-shirt, hoodie of sweater
- Verschillende kleuren: Wit, Zwart, Grijs
- Schone mockup foto's zonder print
- Locatie: `public/mockups/white-ch.jpg`

**Voorbeeld:**
- `/mockups/white-ch.jpg` - Wit t-shirt (blank)

### 3. Resultaat: Legend op Kledingstuk
- De legend illustratie geprint op het kledingstuk
- Dit is wat de klant ontvangt
- Mockup laat eindresultaat zien
- Locatie: `public/mockups/legend_op_shirt*.jpg`

**Voorbeelden:**
- `/mockups/legend_op_shirt.jpg` - Legend op zwart shirt
- `/mockups/legend_op_shirt copy.jpg` - Legend op wit shirt

## 🛒 Customer Journey

1. **Klant kiest een Legend**
   - Wereldlegends (Pelé, Maradona, Cruijff)
   - OF Eredivisie clublegends per seizoen

2. **Klant kiest Product Type**
   - T-Shirt (€29.99)
   - Hoodie (€54.99)
   - Sweater (€44.99)

3. **Klant kiest Variant**
   - Kleur: Wit, Zwart, Grijs
   - Maat: S, M, L, XL, XXL, XXXL

4. **Resultaat**
   - Mockup preview toont hoe het eruitziet
   - Legend PNG + Kledingstuk = Product
   - Klant voegt toe aan winkelwagen

## 🗂️ Database Structuur

### Legends Table
- `png_url` - Link naar de legend illustratie (PNG)
- `category` - 'legends' (wereld) of 'eredivisie' (club)

### Product Variants Table
- `product_type_id` - tshirt, hoodie, sweater
- `color_name` & `color_hex` - Kleur van het kledingstuk
- `size` - Maat
- `mockup_image_url` - Foto van legend OP het kledingstuk (eindresultaat)

### Order Items
- Combinatie van legend_id + product_variant_id
- Klant bestelt "Legend X op Product Y in maat Z"

## 🎨 Mockup Preview Systeem

De `MockupPreview` component toont:
1. Het blank kledingstuk als achtergrond
2. De legend PNG overlay op het kledingstuk
3. Dit simuleert het eindresultaat

In productie gebruik je:
- `mockup_image_url` van de variant (pre-rendered product foto)
- Of real-time overlay van `legend.png_url` op blank shirt

## 📁 File Structuur

```
public/
├── legends/           # Legend illustraties (input)
│   ├── legend.png
│   ├── legend copy.png
│   └── afe0f531-76dd-4f05-af43-0c5fe6d1eca6.png
│
└── mockups/           # Product mockups
    ├── white-ch.jpg           # Blank wit shirt (basis)
    ├── legend_op_shirt.jpg    # Legend op zwart shirt (resultaat)
    └── legend_op_shirt copy.jpg  # Legend op wit shirt (resultaat)
```

## ✅ Demo Data

Na seeding heb je:
- 3 wereldlegends met verschillende illustraties
- 48 clublegends (6 clubs × 2 seizoenen × 4 legends)
- 54 product variants (3 types × 3 kleuren × 6 maten)
- Alle variants hebben mockup URLs die het eindproduct tonen

## 🔄 Workflow Voor Nieuwe Legends

1. Maak legend illustratie (PNG, transparant)
2. Upload naar `public/legends/`
3. Voeg toe aan database met `png_url`
4. Maak mockups: legend op elk kledingstuk type/kleur
5. Upload mockups naar `public/mockups/`
6. Update `mockup_image_url` in product_variants

## 💡 Key Concept

**Legend (illustratie) + Kledingstuk (blank) = Product (met print)**

De klant koopt NIET een losse legend of los kledingstuk, maar de COMBINATIE: een kledingstuk MET de gekozen legend erop geprint.
