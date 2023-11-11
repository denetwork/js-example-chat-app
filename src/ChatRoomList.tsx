import { ChatMessage, ClientConnect, ClientRoom, ResponseCallback } from "denetwork-chat-client";
import React from "react";
import { ChatRoomEntityItem } from "denetwork-chat-client/dist/entities/ChatRoomEntity";

export interface ChatRoomListProps
{
}

export interface ChatRoomListState
{
	loading : boolean;
	rooms : Array<ChatRoomEntityItem>
}

/**
 * 	@class
 */
export class ChatRoomList extends React.Component<ChatRoomListProps, ChatRoomListState>
{
	initialized : boolean = false;
	messagesEnd : any = null;
	clientRoom : ClientRoom = new ClientRoom();


	constructor( props : any )
	{
		super( props );
		this.state = {
			loading : true,
			rooms : [],
		};
	}

	componentDidUpdate()
	{
		this._scrollToBottom();
	}

	componentDidMount()
	{
		if ( this.initialized )
		{
			console.log( `🍔 componentDidMount, already initialized` );
			return;
		}
		this.initialized = true;

		//	...
		console.log( `🍔 componentDidMount` );
		this._loadRooms( ( _response : any ) =>
		{
			this._scrollToBottom();
			setTimeout( () =>
			{
				this.setState( { loading : false } );

			}, 1000 );
		} );
	}

	private _scrollToBottom()
	{
		this.messagesEnd.scrollIntoView({ behavior: "smooth" });
	}

	private _loadRooms( callback : ResponseCallback )
	{
		this.clientRoom.queryRooms().then( ( rooms : Array<ChatRoomEntityItem> ) =>
		{

		}).catch( err =>
		{
			console.error( err );
		});
	}


	render()
	{
		return (
			<div className="RoomListDiv">
				<div className="titleBar sticky-top">Room List</div>
				<div className="listContainer">
					{ this.state.loading ? (
						<div>Loading ...</div>
					) : (
						<div></div>
					) }
					<div style={{ float:"left", clear: "both" }}
					     ref={(el) => { this.messagesEnd = el; }}>
					</div>
				</div>
			</div>
		);
	}
}
