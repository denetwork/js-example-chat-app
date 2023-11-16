import React from 'react';
import './App.css';
import { ChatMessageList } from "./components/ChatMessageList/ChatMessageList";
import { RoomList } from "./components/RoomList/RoomList";


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
		this.onSelectUserChanged = this.onSelectUserChanged.bind( this );
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

	onSelectUserChanged( e : any )
	{
		const userId : number = parseInt( e.target.value );
		const childInstance = this.refChatMessageList.current;
		childInstance.setUser( userId );
	}


	render()
	{
		return (
			<div className="App">
				<div className="App-header">
					I am : &nbsp;
					<select onChange={ this.onSelectUserChanged } >
						<option value={1}>Alice</option>
						<option value={2}>Bob</option>
						<option value={3}>Mary</option>
					</select>
				</div>
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
