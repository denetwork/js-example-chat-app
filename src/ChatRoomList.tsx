import { ChatMessage } from "denetwork-chat-client";
import React from "react";

export interface ChatRoomListProps
{
}

export interface ChatRoomListState
{
	loading : boolean;
	value : string;
	messages : Array<ChatMessage>;
}

/**
 * 	@class
 */
export class ChatRoomList extends React.Component<ChatRoomListProps, ChatRoomListState>
{
	constructor( props : any )
	{
		super( props );
	}

	render()
	{
		return (
			<div></div>
		);
	}
}
