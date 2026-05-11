/*    /\_/\  */ #include <bits/stdc++.h>
/*   (= ._.)  */using namespace std;
/*   / >  \>  */using namespace chrono;
// #include<ext/pb_ds/assoc_container.hpp>
// #include<ext/pb_ds/tree_policy.hpp>
// using namespace __gnu_pbds;

// template <typename T>
// using ordered_set = tree<T, null_type, less<T>, rb_tree_tag, tree_order_statistics_node_update>;

#define ll           long long
//-------------------LUUVE-----------------------------/// 


ll n;

ll solve(ll i,ll j,vector<ll>&a){
    vector<ll>reso(n+1,0);
    while(i>=0 and j<2*n){
        if(a[i]==a[j])reso[a[i]]=1;
        else break;
        i--;
        j++;
    }
    for(ll i=0;i<n+1;i++){
        if(reso[i]==0)return i;
    }
    return n+1;
}

void MANI(){ 
    ll m,k,ans=1,sum=0;cin>>n;
    vector<ll>a(n*2),b(n),v;
    for(auto &i:a)cin>>i;
    ll x=-1,y=-1;
    for(int i=0;i<2*n;i++){
        if(!a[i]){
            if(x==-1)x=i;
            else y=i;
        }
    }
    cout<<max({solve(x,x,a),solve(y,y,a),solve((x+y)/2,(x+y+1)/2,a)});
}

//------------------Main-----------------------------///
int main(){
  ios::sync_with_stdio(false);
    cin.tie(nullptr);
    ll tt=1;
    cin>>tt;
    while(tt--){
        MANI();
        cout<<endl;
     } 
  }
//-----------------TIPS------------------------///
// in case of map TLE use---> gp_hash_table<ll,ll> mp;