import Admin from "./Admin.js";
import PropertyPrice from "./PropertyPrice.js";
import SeasonalRate from "./SeasonalRate.js";

PropertyPrice.hasMany(SeasonalRate, {
  foreignKey: "propertyId",
  as: "seasonalRates",
  onDelete: "CASCADE",
});

SeasonalRate.belongsTo(PropertyPrice, {
  foreignKey: "propertyId",
  as: "property",
});

export { Admin, PropertyPrice, SeasonalRate };
