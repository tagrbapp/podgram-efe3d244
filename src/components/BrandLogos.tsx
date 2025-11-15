const BrandLogos = () => {
  const brands = ["YSL", "GUCCI", "CK", "GIVENCHY", "PRADA", "CHANEL"];

  return (
    <div className="flex items-center justify-center gap-8 mt-8">
      {brands.map((brand) => (
        <div
          key={brand}
          className="text-white font-bold text-lg opacity-90 hover:opacity-100 transition-smooth cursor-pointer tracking-widest"
        >
          {brand}
        </div>
      ))}
    </div>
  );
};

export default BrandLogos;
