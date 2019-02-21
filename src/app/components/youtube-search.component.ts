import { Component, OnInit } from '@angular/core';
import { YoutubeGetVideo } from '../services/youtube.service';
import { PlayerComponent } from '../components/player/player.component';
import { PlaylistComponent } from '../components/playlist/playlist.component';
import { GlobalsService } from '../services/globals.service';
import { SharedService } from '../services/shared.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SpeechRecognitionService } from '../speech-recognition.service';

@Component({
  selector: 'app-search',
  templateUrl: 'youtube-search.component.html',
})

export class SearchComponent implements OnInit {
 
  showSearchButton: boolean;
  stopListeningButton: boolean;
  searchForm: FormGroup;
  noResults = false;

  constructor(
    private youtube: YoutubeGetVideo,
    private globals: GlobalsService,
    private shared: SharedService,
    private playerComp: PlayerComponent,
    private playlist: PlaylistComponent,
    private speechRecognitionService: SpeechRecognitionService
  ) {
    this.showSearchButton = true;
    this.stopListeningButton = false;
  }

  ngOnInit() {
    console.log('search on ngooinit');
    this.searchFunction();
  }

  async searchVideo(query: any) {
    console.log('in search video function')
    console.log('Search method',this.searchForm.value.searchInput);
    const res = await this.youtube.searchVideo(query);
    this.shared.convertVideoObject(res['items'], 'searchedVideos');
    if (res['items'].length === 0) {
      this.noResults = true;
    } else {
      this.noResults = false;
    }
    this.shared.convertVideoObject(res['items'], 'lastSearchedVideos');
  }

  searchFunction() {
     console.log('in the search function')
    this.searchForm = new FormGroup({
      searchInput: new FormControl('', [Validators.required, Validators.minLength(2)])
    });
    //console.log('Search',this.searchForm);
    this.searchForm.valueChanges.subscribe((form) => {
      this.searchVideo(form.searchInput);
    });
  }

  clearSearch() {
    console.log('in the clear serch')
    this.searchForm.reset();
    this.globals.searchedVideos = null;
  }

  onSubmit(event: Event) {
    console.log('in the submit')
   //console.log('Search Submit',this.searchForm);
    event.preventDefault();
  }

  onClick(event:Event){
    event.preventDefault();
    console.log('in the onclick function')
  }

  onClickVideo(event: Event, i: any, list: number) {
    console.log('event',event);
    console.log('in the on the click video')
    if (list === 1) {
      this.playerComp.getVideo(this.globals.searchedVideos[i]);
      this.clearSearch();
    } else if (list === 3) {
      this.playerComp.getVideo(this.globals.feedVideos[i]);
    }
    this.clearSearch();
  }

  onCopyVideoItemLink(i: number, list: number) {
    this.shared.onCopyVideoItemLink(i, list);
    this.clearSearch();
  }

  addPlaylistItem(i: number, list: number) {
    this.playlist.addPlaylistItem(i, list);
    this.clearSearch();
  }


  activateSpeechSearch(): void {
    console.log("in active speech  search");
    this.showSearchButton = false;

    this.speechRecognitionService.record()
        .subscribe(
        //listener
        (value) => {
            this.searchForm.patchValue(
              {
                searchInput:value
              }
              
            )
            this.searchVideo(value);
            console.log('listener.speechData:', value);
        },
        //error
        (err) => {
            console.log(err);
            if (err.error == "no-speech") {
                console.log("--restarting service--");
                this.activateSpeechSearch();
            }
        },
        //completion
        () => {
            this.showSearchButton = true;
            console.log("--complete--");
            if (!this.stopListeningButton) {
              this.activateSpeechSearch();
            }
        });
  }

  deActivateSpeechSearch(): void
   {
      console.log("in deactive speech search");
      this.showSearchButton = true;
      this.stopListeningButton = true;
      this.speechRecognitionService.DestroySpeechObject();
  }
}
