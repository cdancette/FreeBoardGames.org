import { RoomDb } from '../../db/RoomDb';
import { Room, NewRoomResponse, NewRoomResponseStatus } from '../../../../common/dto/Room';
import { UserDb } from '../../db/UserDb';
import { UserInRoomDb } from '../../db/UserInRoomDb';

export class RoomService {
  public static async newRoom(userDbEntity: UserDb, room: Room) {
    const roomDbEntity = new RoomDb();
    roomDbEntity.capacity = room.capacity;
    roomDbEntity.gameCode = room.gameCode;
    roomDbEntity.unlisted = room.unlisted;
    await roomDbEntity.save();

    const userInRoom = new UserInRoomDb();
    userInRoom.room = roomDbEntity;
    userInRoom.user = userDbEntity;
    await userInRoom.save();

    const response: NewRoomResponse = { status: NewRoomResponseStatus.Success, room: roomDbEntity };
    return response;
  }

  public static async listRooms() {
    const roomsFromDb = await RoomDb.find({
      where: { unlisted: false },
      relations: ['users'],
    });
    const rooms = roomsFromDb.map((room) => {
      const { capacity, gameCode } = room;
      const usersInRoom = room.usersInRoom || []; // FIXME this is probably not right
      return { capacity, gameCode, users };
    });
    return rooms;
  }

  public static async getRoom(id: number) {
    // room is retrieved with users who joined most recently being first in the users array
    const room = await RoomDb.findOne({
      where: { id },
      relations: ['users'],
    });
    return room;
  }

  public static async isUserInRoom(room: RoomDb, user: UserDb) {
    const usersInRoom = room.users.map((user) => user.id);
    const userID = user.id;
    return usersInRoom.includes(userID);
  }

  public static async joinRoom(room: RoomDb, user: UserDb) {
    room.users.push(user);
    await room.save();
  }

  public static async leaveRoom(room: RoomDb, user: UserDb) {
    const roomUsers = room.users.filter((userInRoom) => userInRoom.id !== user.id);
    room.users = roomUsers;
    await room.save();
  }
}
