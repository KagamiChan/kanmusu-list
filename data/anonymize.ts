import fs from "fs-extra";
import _ from "lodash";
import { APIShip } from "kcsapi/api_port/port/response";
import { APISlotItem } from "kcsapi/api_get_member/require_info/response";

const getNewIdMap = (data: APIShip[] | APISlotItem[]) => {
  const maxEquipmentId = _(data).map("api_id").max();
  const newIds = _(_.range(1, maxEquipmentId + 10000))
    .sampleSize(_.size(data))
    .value();

  return _(data).map("api_id").zip(newIds).fromPairs().value();
};

const main = async () => {
  const equipments: APISlotItem[] = await fs.readJSON("./equipments.json");

  const ships: APIShip[] = await fs.readJSON("./ships.json");

  const equipmentMap = getNewIdMap(equipments);

  const shipMap = getNewIdMap(ships);

  const newEquipments: APISlotItem[] = _(equipments)
    .map((equip) => ({
      ...equip,
      api_id: equipmentMap[equip.api_id]!,
    }))
    .value();

  const newShips: APIShip[] = _(ships)
    .map((ship) => ({
      ...ship,
      api_id: shipMap[ship.api_id]!,
      api_slot: _.map(ship.api_slot, (i) => equipmentMap[i] ?? i),
      api_slot_ex: equipmentMap[ship.api_slot_ex] || ship.api_slot_ex,
    }))
    .value();

  await Promise.all([
    fs.outputJSON("./equipments.json", _.sortBy(newEquipments, "api_id"), {
      spaces: 2,
    }),
    fs.outputJSON("./ships.json", _.sortBy(newShips, "api_id"), { spaces: 2 }),
  ]);
};

main();
