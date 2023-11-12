import React from 'react';
import './App.css';
import { ChatMessageList } from "./components/ChatMessageList/ChatMessageList";
import { ChatRoomListProps, ChatRoomListState, RoomList } from "./components/RoomList/RoomList";
import { ChatRoomEntityItem } from "denetwork-chat-client/dist/entities/ChatRoomEntity";


export interface AppProps
{
}

export interface AppState
{
}

export class App extends React.Component<AppProps, AppState>
{
	refChatMessageList : React.RefObject<any>;

	constructor( props : any )
	{
		super( props );

		this.refChatMessageList = React.createRef();

		this.onRoomChanged = this.onRoomChanged.bind( this );
	}

	onRoomChanged( roomId : string )
	{
		console.log( `App::onRoomChanged :`, roomId );

		const childInstance = this.refChatMessageList.current;
		childInstance.asyncLoad( roomId ).then( ( res : boolean ) =>
		{
			console.log( `App::onRoomChanged ChatMessageList.asyncLoad :`, res );
		}).catch( ( err : any ) =>
		{
			console.error( `App::onRoomChanged err: `, err );
		})
	}


	render()
	{
		return (
			<div className="App">
				<div className="App-body">
					<div className="RoomColumn">
						<RoomList callbackOnRoomChanged={ this.onRoomChanged }></RoomList>
					</div>
					<div className="ChatColumn">
						<ChatMessageList
							ref={this.refChatMessageList}
							serverUrl="localhost:6612"
						/>
					</div>
				</div>
			</div>
		);
	}
}
