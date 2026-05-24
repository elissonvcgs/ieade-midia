REVOKE ALL ON FUNCTION private.is_congresso_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_chat_room_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_add_chat_room_member(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_congresso_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_chat_room_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_add_chat_room_member(uuid, uuid, uuid) TO authenticated;